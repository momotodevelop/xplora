import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Dictionaries, FlightOffer, Segment } from '../../types/flight-offer-amadeus.types';
import { DateStringPipe } from '../../date-string.pipe';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FlightOffersAmadeusService } from '../../services/flight-offers-amadeus.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { Observable, concatMap, forkJoin, from, map, toArray } from 'rxjs';
import { AmadeusGetLocationResponse, AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { TranslateService } from '../../services/translate.service';
import { DurationPipe } from '../../duration.pipe';
import { FlightClassNamePipe } from '../../flight-class-name.pipe';
import { GoogleTranslationService, V2Response } from '../../services/google-translation.service';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { FacebookPixelService } from '../../services/facebook-pixel.service';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-flight-offer-details',
    imports: [DateStringPipe, TitleCasePipe, CommonModule, DateStringPipe, DurationPipe, FlightClassNamePipe, XploraBottomSheetComponent],
    templateUrl: './flight-offer-details.component.html',
    styleUrl: './flight-offer-details.component.scss',
    providers: [DatePipe]
})
export class FlightOfferDetailsComponent implements OnInit {
  loading:boolean=false;
  locations:AmadeusLocation[]=[];
  constructor(
    private _bottomSheetRef: MatBottomSheetRef<FlightOfferDetailsComponent>, 
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {offer:FlightOffer, dictionaries:Dictionaries},
    private offers:FlightOffersAmadeusService,
    private airports: AirportSearchService,
    private translate: GoogleTranslationService,
    private gtag: Analytics,
    private fbp: FacebookPixelService
  ){
  }

  ngOnInit(): void {
    this.loading=true;
    this.getAllLocations(this.extractIATACodes(this.data.offer.itineraries[0].segments)).subscribe(locations=>{
          this.locations=locations;
          this.loading=false;
          logEvent(this.gtag, 'view_item',
            {
              currency: 'MXN',
              value: this.data.offer.price.total as number,
              items: this.data.offer.itineraries[0].segments.map(segment=>{
                return {
                  item_id: segment.id,
                  item_name: (segment.operating.carrierCode??segment.carrierCode)+segment.number.toString(),
                  item_category: 'Vuelo',
                  departure_date: segment.departure.at,
                  arrival_date: segment.arrival.at,
                  origin: segment.departure.iataCode,
                  destination: segment.arrival.iataCode
                }
              })
            }
          );
          this.fbp.track('ViewContent');
    });
  }

  getAllLocations(locations:string[]):Observable<AmadeusLocation[]>{
    const locationRequest:Observable<AmadeusGetLocationResponse>[] = locations.map(iataCode => this.airports.getLocation("A"+iataCode));
    return forkJoin(locationRequest).pipe(
      concatMap(locations => from(locations)),
      concatMap((response: AmadeusGetLocationResponse) => 
        this.translateLocation(response.data) // Asume que esto devuelve un Observable
      ),
      toArray()
    );
  }
  translateLocation(location: AmadeusLocation):Observable<AmadeusLocation> {
    const translation = this.translate.translateV2([location.address.cityName, location.address.countryName], 'es');
    return translation.pipe(map((response: V2Response) => {
      return {
        ...location,
        address: {
          ...location.address,
          cityName: response.data.translations[0].translatedText,
          countryName: response.data.translations[1].translatedText
        }
      };
    }))

  }
  createCheckedBagsText(segmentID:string):string{
    const segment=this.getFareInfoBySegment(segmentID);
    const checkedBags = segment?.includedCheckedBags?.quantity ?? 0;
    let returnText;
    if(checkedBags>0){
      returnText = "Incl. "+checkedBags.toString()+" pieza"+(checkedBags===1?'':'s')+" de equipaje documentado"
    }else{
      returnText = "No incluye equipaje documentado";  
    }
    return returnText;
  }
  createCabinBagsText(segmentID:string):string{
    const cabinBags = this.getFareInfoBySegment(segmentID)?.includedCabinBags?.quantity ?? 0;
    if(cabinBags < 1) return 'No se reporta equipaje de mano incluido';
    return `Incl. ${cabinBags} pieza${cabinBags === 1 ? '' : 's'} de equipaje de mano`;
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  select(){
    this._bottomSheetRef.dismiss({action: 'select'});
  }
  getLocationInfo(iata:string):AmadeusLocation|undefined{
    return this.locations.find(location=>location.iataCode===iata);
  }
  carrierDefinition(id:string){
    return this.offers.getAirlineName(id, this.data.dictionaries);
  }
  aircraftDefinition(id:string){
    return this.offers.getAircraftName(id, this.data.dictionaries);
  }
  getFareInfoBySegment(id:string){
    return this.data.offer.travelerPricings[0]?.fareDetailsBySegment.find(segment=>segment.segmentId===id);
  }
  getConnectionDuration(segmentIndex:number):string {
    const segments = this.data.offer.itineraries[0].segments;
    const currentArrival = new Date(segments[segmentIndex].arrival.at).getTime();
    const nextDeparture = new Date(segments[segmentIndex + 1].departure.at).getTime();
    const totalMinutes = Math.max(0, Math.round((nextDeparture - currentArrival) / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `PT${hours ? `${hours}H` : ''}${minutes ? `${minutes}M` : ''}`;
  }
  hasTerminalChange(segmentIndex:number):boolean {
    const segments = this.data.offer.itineraries[0].segments;
    const arrivalTerminal = segments[segmentIndex].arrival.terminal;
    const departureTerminal = segments[segmentIndex + 1].departure.terminal;
    return Boolean(arrivalTerminal && departureTerminal && arrivalTerminal !== departureTerminal);
  }
  isLongConnection(segmentIndex:number):boolean {
    const segments = this.data.offer.itineraries[0].segments;
    const currentArrival = new Date(segments[segmentIndex].arrival.at).getTime();
    const nextDeparture = new Date(segments[segmentIndex + 1].departure.at).getTime();
    return nextDeparture - currentArrival >= 24 * 60 * 60 * 1000;
  }
  extractIATACodes(segments: Segment[]): string[] {
    const iataCodes: string[] = [];
  
    segments.forEach(segment => {
      // Verifica si el iataCode de departure ya existe en el arreglo. Si no, lo agrega.
      if (!iataCodes.includes(segment.departure.iataCode)) {
        iataCodes.push(segment.departure.iataCode);
      }
      // Verifica si el iataCode de arrival ya existe en el arreglo. Si no, lo agrega.
      if (!iataCodes.includes(segment.arrival.iataCode)) {
        iataCodes.push(segment.arrival.iataCode);
      }
    });
  
    return iataCodes;
  }
}

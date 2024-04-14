import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { Dictionaries, FareDetailsBySegment, FlightOffer, Segment } from '../../types/flight-offer-amadeus.types';
import { DateStringPipe } from '../../date-string.pipe';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FlightOffersAmadeusService } from '../../services/flight-offers-amadeus.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { Observable, concatMap, forkJoin, from, map, toArray } from 'rxjs';
import { AmadeusGetLocationResponse, AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { TranslateService } from '../../services/translate.service';
import { DurationPipe } from '../../duration.pipe';
import { FlightClassNamePipe } from '../../flight-class-name.pipe';

@Component({
  selector: 'app-flight-offer-details',
  standalone: true,
  imports: [DateStringPipe, TitleCasePipe, CommonModule, DateStringPipe, DurationPipe, FlightClassNamePipe],
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
    private auth: AmadeusAuthService,
    private translate: TranslateService,
  ){
  }

  ngOnInit(): void {
    this.loading=true;
    this.auth.getToken().subscribe({
      next: (token)=>{
        this.getAllLocations(this.extractIATACodes(this.data.offer.itineraries[0].segments), token as string).subscribe(locations=>{
          this.locations=locations;
          this.loading=false;
        })
      }
    });
  }

  getAllLocations(locations:string[], token:string):Observable<AmadeusLocation[]>{
    const locationRequest:Observable<AmadeusGetLocationResponse>[] = locations.map(iataCode => this.airports.getLocation("A"+iataCode, token as string));
    return forkJoin(locationRequest).pipe(
      concatMap(locations => from(locations)),
      concatMap((response: AmadeusGetLocationResponse) => 
        this.translate.translateLocation(response.data) // Asume que esto devuelve un Observable
      ),
      toArray()
    );
  }
  createCheckedBagsText(segmentID:string):string{
    const segment=this.getFareInfoBySegment(segmentID);
    console.log(segment.includedCheckedBags.quantity);
    let cabinBags = segment?.includedCheckedBags?.quantity ?? 0;
    let returnText;
    if(cabinBags>0){
      returnText = "Incl. "+cabinBags.toString()+" pieza"+(cabinBags>0?'s':'')+" de equipaje documentado"
    }else{
      returnText = "No incluye equipaje documentado";  
    }
    return returnText;
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  getLocationInfo(iata:string):AmadeusLocation{
    return this.locations.filter(location=>location.iataCode===iata)[0];
  }
  carrierDefinition(id:string){
    return this.offers.getAirlineName(id, this.data.dictionaries);
  }
  aircraftDefinition(id:string){
    return this.offers.getAircraftName(id, this.data.dictionaries);
  }
  getFareInfoBySegment(id:string){
    return this.data.offer.travelerPricings[0].fareDetailsBySegment.filter(segment=>segment.segmentId)[0]
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

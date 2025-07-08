import { Component, OnInit } from '@angular/core';
import { FlightClassType, SearchTopbarComponent } from './search-topbar/search-topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ResultsViewComponent } from './results-view/results-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map } from 'rxjs';
import { SharedDataService } from '../../services/shared-data.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { Passengers } from '../home/search/search.component';
import { TranslateService } from '../../services/translate.service';
import { SelectedFlightComponent } from './selected-flight/selected-flight.component';
import { FlightOffersDataHandlerService } from '../../services/flight-offers-data-handler.service';
import { XploraApiService } from '../../services/xplora-api.service';
import { FireBookingService } from '../../services/fire-booking.service';
import { Timestamp } from 'firebase/firestore';
import { BookingStatus, FlightFirebaseBooking } from '../../types/booking.types';
import { GoogleTranslationService } from '../../services/google-translation.service';
import { Title } from '@angular/platform-browser';
import  * as _  from 'lodash';
import { MetaHandlerService } from '../../services/meta-handler.service';
export interface SearchParams{
  adults: string
  childrens: string
  departure: string
  destination: string
  infants: string
  origin: string
  return: string
  flightClass: FlightClassType
}

export interface SimpleBookingItem{
  origin: AmadeusLocation,
  destination: AmadeusLocation,
  passengers: Passengers,
  departure: Date,
  round: Boolean,
  status: BookingStatus,
  return?: Date,
  
}
@Component({
    selector: 'app-flight-search',
    imports: [SearchTopbarComponent, SidebarComponent, ResultsViewComponent, SelectedFlightComponent],
    templateUrl: './flight-search.component.html',
    styleUrl: './flight-search.component.scss',
    providers: []
})
export class FlightSearchComponent implements OnInit {
  origin!: AmadeusLocation;
  destination!: AmadeusLocation;
  departure: Date = new Date();
  return: Date|undefined;
  passengers: Passengers = {
    adults: 1,
    childrens: 0,
    infants: 0
  }
  searchParams!:SearchParams;
  constructor(
    private route: ActivatedRoute, 
    private sharedService: SharedDataService, 
    private airports: AirportSearchService, 
    private amadeusToken:AmadeusAuthService, 
    private translate: GoogleTranslationService,
    private fireBooking: FireBookingService,
    private flightOffersHandler: FlightOffersDataHandlerService,
    private router: Router,
    private xplora: XploraApiService,
    private meta: MetaHandlerService
  ){}

  ngOnInit(): void {
    this.sharedService.setBookingMode(true);
    this.sharedService.setLoading(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.route.params.subscribe((p)=>{
      const params:SearchParams = p as SearchParams;
      this.searchParams={
        ...params,
        origin: this.removeLocationType(params.origin),
        destination: this.removeLocationType(params.destination)
      };
      this.meta.setMeta({
        title: "Xplora Travel || Vuelos " + params.origin.toUpperCase() + " → " + params.destination.toUpperCase(),
        description: "Encuentra y compara vuelos baratos desde " + params.origin.toUpperCase() + " hacia " + params.destination.toUpperCase() + ". Explora las mejores opciones de aerolíneas, horarios y precios para tu próximo viaje con Xplora Travel.",
        image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fflights.jpg?alt=media&token=0defc707-55a6-4886-ac34-0507d3089aa3"
      });
      this.departure = new Date(params.departure+"T13:00:00.000Z");
      this.return = params.return!=="NA"?new Date(params.return+"T13:00:00.000Z"):undefined;
      this.passengers = {
        adults: parseInt(params.adults),
        childrens: parseInt(params.childrens),
        infants: parseInt(params.infants)
      }
      this.amadeusToken.getToken().subscribe({
        next: (token) => {
          const originRequest = this.airports.getLocation(params.origin, token as string);
          const destinationRequest = this.airports.getLocation(params.destination, token as string);
          forkJoin([originRequest, destinationRequest]).subscribe(results=>{
            this.origin = results[0].data;
            this.destination = results[1].data;
            this.sharedService.setLoading(false);
            this.meta.setMeta({
              title: "Xplora Travel || Vuelos "+this.origin.address.cityName+" → "+this.destination.address.cityName,
              description: "Encuentra y compara vuelos baratos desde " + this.origin.address.cityName + " hacia " + this.destination.address.cityName + ". Explora las mejores opciones de aerolíneas, horarios y precios para tu próximo viaje con Xplora Travel.",
            });
          })
        }
      })
    });
    this.flightOffersHandler.flightSelectionStatus.subscribe(status=>{
      if(status==="FULL"){
        const round = this.return!==undefined;
        this.sharedService.setLoading(true);
        let bookingInfo:FlightFirebaseBooking = {
          type: "FLIGHT",
          status: "PENDING",
          flightDetails: {
            departure: new Timestamp(this.departure.getTime()/1000, 0),
            origin: this.origin,
            destination: this.destination,
            passengers: {
              counts: this.passengers,
              details: []
            },
            round,
            flights: this.flightOffersHandler.getFlights()
          }
        }
        if(round&&this.return){
          bookingInfo.flightDetails.return = new Timestamp(this.return.getTime()/1000, 0);
        }
        this.fireBooking.addBooking(bookingInfo).then(ok=>{
          /* const outboundFlight = bookingInfo.flightDetails.flights.outbound!;
          //console.log(ok);
            const items:any[]=[{
              item_name: outboundFlight.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(outboundFlight.offer.itineraries[0].segments)!.arrival.iataCode,
              item_id: outboundFlight.offer.id,
              price: outboundFlight.offer.price.total as number,
              quantity: 1
            }];
            let total = outboundFlight.offer.price.total as number;
            if(bookingInfo.flightDetails.flights.inbound){
              total += bookingInfo.flightDetails.flights.inbound.offer.price.total as number;
              items.push({
                item_name: bookingInfo.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(bookingInfo.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
                item_id: bookingInfo.flightDetails.flights.inbound.offer.id,
                price: bookingInfo.flightDetails.flights.inbound.offer.price.total as number,
                quantity: 1
              })
            } */
            /* this.gtag.event('begin_checkout', {
              currency: 'MXN',
              value: total,
              items
            }); */
          this.router.navigate(['/reservar', 'vuelos', ok]);
        }).catch(err=>{
          console.error(err);
          this.sharedService.setLoading(false);
        });
      }
    })
  }
  openFilter(){

  }
  removeLocationType(location: string): string {
    //console.log(location);
    if (location.length !== 4) {
      throw new Error('El string de origen debe tener exactamente 4 caracteres.');
    }
    return location.substring(1);
  }
}

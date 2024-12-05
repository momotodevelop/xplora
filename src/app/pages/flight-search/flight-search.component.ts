import { Component, OnInit } from '@angular/core';
import { FlightClassType, SearchTopbarComponent } from './search-topbar/search-topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ResultsViewComponent } from './results-view/results-view.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { SharedDataService } from '../../services/shared-data.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { AmadeusLocation, AmadeusLocationResponseError } from '../../types/amadeus-airport-response.types';
import { Passengers } from '../home/search/search.component';
import { DatePipe } from '@angular/common';
import { TranslateService } from '../../services/translate.service';
import { SelectedFlightComponent } from './selected-flight/selected-flight.component';
import { FlightOffersDataHandlerService } from '../../services/flight-offers-data-handler.service';
import { XploraApiService } from '../../services/xplora-api.service';
import { BookingStatus } from '../../types/xplora-api.types';
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
  standalone: true,
  imports: [SearchTopbarComponent, SidebarComponent, ResultsViewComponent, DatePipe, SelectedFlightComponent],
  templateUrl: './flight-search.component.html',
  styleUrl: './flight-search.component.scss',
  providers: [DatePipe]
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
    private translate: TranslateService, 
    private flightOffersHandler: FlightOffersDataHandlerService,
    private xplora: XploraApiService){}

  ngOnInit(): void {
    this.sharedService.settBookingMode(true);
    this.sharedService.setLoading(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
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
            const observables=results.map(location=>{
              return this.translate.translateLocation(location.data);
            });
            forkJoin(observables).subscribe(locations=>{
              this.origin = locations[0];
              this.destination = locations[1];
              this.sharedService.setLoading(false);
            })
          })
        }
      })
    });
    this.flightOffersHandler.flightSelectionStatus.subscribe(status=>{
      if(status==="FULL"){
        const round = this.return!==undefined;
        this.sharedService.setLoading(true);
        let item:SimpleBookingItem = {
          origin: this.origin,
          destination: this.destination,
          departure: this.departure,
          passengers: this.passengers,
          status: "PENDING",
          round
        }
        if(item.round){
          item.return=this.return;
        }
        this.xplora.createBooking(this.flightOffersHandler.createBookingAddFlights(item)).subscribe((resp)=>{
          console.log(resp);
          if(resp&&resp.status==="CREATED"){
            const url = `/reservar/vuelos/${resp.id}`;
            window.location.href = url;
          }
        });
      }
    })
  }
  openFilter(){

  }
  removeLocationType(location: string): string {
    console.log(location);
    if (location.length !== 4) {
      throw new Error('El string de origen debe tener exactamente 4 caracteres.');
    }
    return location.substring(1);
  }
}

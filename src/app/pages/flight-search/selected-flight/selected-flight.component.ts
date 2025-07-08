import { Component, Input, OnInit } from '@angular/core';
import { Dictionaries, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { FlightOffersDataHandlerService } from '../../../services/flight-offers-data-handler.service';
import { FlightOfferComponent } from '../flight-offer/flight-offer.component';

@Component({
    selector: 'app-selected-flight',
    imports: [FlightOfferComponent],
    templateUrl: './selected-flight.component.html',
    styleUrl: './selected-flight.component.scss'
})
export class SelectedFlightComponent implements OnInit {
  offer:FlightOffer|undefined;
  dictionaries:Dictionaries|undefined;
  constructor(private offersHandler:FlightOffersDataHandlerService){

  }
  ngOnInit(): void {
    this.offersHandler.selected.subscribe(({
      next: (selected) => {
        //console.log(selected);
        if(selected&&selected.outbound){
          const selectedFlight = selected.outbound;
          this.offer = selectedFlight.offer;
          this.dictionaries = selectedFlight.dictionaries;
        }else{
          this.offer=undefined;
          this.dictionaries=undefined;
        }
      }
    }))
  }
  removeFlight(){
    this.offersHandler.resetFlightSelection();
  }
}

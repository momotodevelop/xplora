import { Component, OnInit } from '@angular/core';
import { Dictionaries, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { FlightOffersDataHandlerService } from '../../../services/flight-offers-data-handler.service';
import { CommonModule } from '@angular/common';
import { DurationPipe } from '../../../duration.pipe';

@Component({
    selector: 'app-selected-flight',
    imports: [CommonModule, DurationPipe],
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
  get firstSegment(){
    return this.offer?.itineraries[0]?.segments[0];
  }
  get lastSegment(){
    const segments = this.offer?.itineraries[0]?.segments ?? [];
    return segments[segments.length - 1];
  }
  get airlineName():string {
    const code = this.firstSegment?.operating?.carrierCode || this.firstSegment?.carrierCode;
    return (code && this.dictionaries?.carriers?.[code]) || code || 'Aerolínea';
  }
  get displayPrice():number|string {
    return this.offer?.promoPrice?.discountedTotal ?? this.offer?.price?.grandTotal ?? 0;
  }
}

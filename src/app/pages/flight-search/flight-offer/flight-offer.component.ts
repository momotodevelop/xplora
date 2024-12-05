import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dictionaries, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { FlightOfferDetailsComponent } from '../../../shared/flight-offer-details/flight-offer-details.component';
import { FlightOffersDataHandlerService } from '../../../services/flight-offers-data-handler.service';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DateStringPipe } from '../../../date-string.pipe';
import { DurationPipe } from '../../../duration.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-flight-offer',
    imports: [MatBottomSheetModule, CommonModule, DateStringPipe, DurationPipe, MatChipsModule, MatTooltipModule, MatIconModule, CurrencyPipe,],
    templateUrl: './flight-offer.component.html',
    styleUrl: './flight-offer.component.scss'
})
export class FlightOfferComponent {
  @Input() offer!:FlightOffer;
  @Input() dictionaries!:Dictionaries;
  @Input() selected:boolean=false;
  @Output() selectedFlight: EventEmitter<{
    offer:FlightOffer,
    dictionaries: Dictionaries
  }> = new EventEmitter();
  @Output() removedFlight: EventEmitter<void> = new EventEmitter();
  hovered:boolean=false;
  constructor(private bs:MatBottomSheet,public flightOffersHandler: FlightOffersDataHandlerService){}
  openDetails(offer:FlightOffer){
    this.bs.open(FlightOfferDetailsComponent, {data: {offer, dictionaries:this.dictionaries}, panelClass: 'flight-offer-details-bottomsheet'});
  }
  removeFlight(event:Event){
    this.removedFlight.emit();
    event.stopPropagation();
  }
  selectFlight(event:Event){
    this.selectedFlight.emit({
      offer: this.offer,
      dictionaries: this.dictionaries
    });
    event.stopPropagation();
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import { CommonModule } from '@angular/common';
import { DurationPipe } from '../../../duration.pipe';
import * as _ from 'lodash';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { Charge } from '../booking-sidebar/booking-sidebar.component';

@Component({
    selector: 'app-confirmation-sidebar',
    imports: [CommonModule, DurationPipe, MatIconModule],
    templateUrl: './confirmation-sidebar.component.html',
    styleUrl: './confirmation-sidebar.component.scss'
})
export class ConfirmationSidebarComponent implements OnInit {
  constructor(public bookingHandler: BookingHandlerService, private route: ActivatedRoute, private sharedService: SharedDataService){}
  @Input() booking!: XploraFlightBooking;
  grandTotal:number = 0;
  totalPassengers:number = 1;
  discountedAmmount:number = 0;
  dates!: {outbound:Date[], inbound?:Date[]};
  insuranceAdded:boolean=false;
  ngOnInit(): void {
      this.dates = {
        outbound: [
          new Date(this.booking!.flights.outbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking!.flights.outbound!.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      if(this.booking.round&&this.booking.flights.inbound!==undefined){
        this.dates.inbound = [
          new Date(this.booking.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      this.grandTotal = this.booking.activePayment!.amount;
      if(this.booking.activePayment!.promo!==undefined){
        this.discountedAmmount = this.booking.activePayment!.originalAmount-this.booking.activePayment!.amount;
      }
      if(this.booking.aditionalServices){
        if(this.booking.aditionalServices.insurance!==undefined){
          if(this.booking.aditionalServices!.insurance!.length>0){
            this.insuranceAdded = true;
          }
        }
      }
  }
  
}

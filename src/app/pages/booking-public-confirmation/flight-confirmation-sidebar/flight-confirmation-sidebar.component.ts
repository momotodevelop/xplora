import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import _ from 'lodash';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { FirebaseBooking, FlightFirebaseBooking } from '../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DurationPipe } from '../../../duration.pipe';

@Component({
  selector: 'app-flight-confirmation-sidebar',
  imports: [CommonModule, DurationPipe, MatIconModule],
  templateUrl: './flight-confirmation-sidebar.component.html',
  styleUrl: './flight-confirmation-sidebar.component.scss'
})
export class FlightConfirmationSidebarComponent {
  constructor(public bookingHandler: BookingHandlerService, private route: ActivatedRoute, private sharedService: SharedDataService){}
  @Input() booking!: FlightFirebaseBooking;
  grandTotal:number = 0;
  totalPassengers:number = 1;
  discountedAmmount:number = 0;
  dates!: {outbound:Date[], inbound?:Date[]};
  insuranceAdded:boolean=false;
  ngOnInit(): void {
      this.dates = {
        outbound: [
          new Date(this.booking!.flightDetails!.flights.outbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking!.flightDetails!.flights.outbound!.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      if(this.booking.flightDetails!.round&&this.booking.flightDetails!.flights.inbound!==undefined){
        this.dates.inbound = [
          new Date(this.booking.flightDetails!.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking.flightDetails!.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      this.grandTotal = this.booking.payment!.amount;
      if(this.booking.payment?.promo!==undefined){
        //this.discountedAmmount = this.booking.payment.originalAmount-this.booking.payment.promo.amount;
      }
      if(this.booking.flightDetails!.aditionalServices){
        if(this.booking.flightDetails!.aditionalServices.insurance!==undefined){
          if(this.booking.flightDetails!.aditionalServices!.insurance.outbound.length>0){
            this.insuranceAdded = true;
          }
        }
      }
  }
}

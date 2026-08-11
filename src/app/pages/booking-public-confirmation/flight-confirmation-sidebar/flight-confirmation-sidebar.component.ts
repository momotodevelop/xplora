import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import _ from 'lodash';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { FirebaseBooking, FlightFirebaseBooking } from '../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DurationPipe } from '../../../duration.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatButtonModule } from '@angular/material/button';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MatTooltipModule } from '@angular/material/tooltip';
import { resolveAirlineLogoUrl } from '../../../utils/airline-logo.utils';

@Component({
  selector: 'app-flight-confirmation-sidebar',
  imports: [CommonModule, DurationPipe, MatIconModule, FontAwesomeModule, MatButtonModule, MatTooltipModule],
  templateUrl: './flight-confirmation-sidebar.component.html',
  styleUrl: './flight-confirmation-sidebar.component.scss'
})
export class FlightConfirmationSidebarComponent implements OnChanges {
  constructor(public bookingHandler: BookingHandlerService, private route: ActivatedRoute, private sharedService: SharedDataService){}
  @Input() booking!: FlightFirebaseBooking;
  grandTotal:number = 0;
  totalPassengers:number = 1;
  discountedAmmount:number = 0;
  dates!: {outbound:Date[], inbound?:Date[]};
  insuranceAdded:boolean=false;
  outboundAirlineLogoUrl:string = '';
  inboundAirlineLogoUrl:string = '';
  infoIcon = faCircleInfo;
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['booking'] || !this.booking?.flightDetails) return;
    const counts = this.booking.flightDetails.passengers.counts;
    this.totalPassengers = counts.adults + counts.childrens + counts.infants;
    this.outboundAirlineLogoUrl = resolveAirlineLogoUrl(
      this.booking.flightDetails.flights.outbound?.offer
    );
    this.inboundAirlineLogoUrl = resolveAirlineLogoUrl(
      this.booking.flightDetails.flights.inbound?.offer
    );

      this.dates = {
        outbound: [
          new Date(this.booking!.flightDetails!.flights.outbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking!.flightDetails!.flights.outbound!.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      if(this.booking.flightDetails!.round&&this.booking.flightDetails!.flights.inbound){
        this.dates.inbound = [
          new Date(this.booking.flightDetails!.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
          new Date(_.last(this.booking.flightDetails!.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
        ]
      }
      this.grandTotal = this.booking.payment?.totalDue ?? this.booking.payment?.amount ?? 0;
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

import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DurationPipe } from '../../../../../duration.pipe';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { FirebaseBooking, FlightFirebaseBooking } from '../../../../../types/booking.types';
import { MatButtonModule } from '@angular/material/button';
import { LocationNamePipe } from '../../../../../city-name.pipe';
import { CountdownModule, CountdownConfig } from 'ngx-countdown';

@Component({
  selector: 'app-booking-quick-details',
  imports: [
    MatIconModule, 
    DurationPipe, 
    CommonModule, 
    MatListModule, 
    MatDividerModule, 
    MatButtonModule, 
    LocationNamePipe,
    CountdownModule
  ],
  templateUrl: './booking-quick-details.component.html',
  styleUrl: './booking-quick-details.component.scss',
  providers: [DurationPipe]
})
export class BookingQuickDetailsComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  activePayment:boolean = false;
  countdownConfig: CountdownConfig = {
    leftTime: 0,
    format: 'hh:mm:ss'
  }
  constructor(){
    //this.booking.flightDetails?.passengers.counts.adults
  }
  ngOnInit(): void {
    this.activePayment = this.booking.payment!.paymentLimit!.toDate() > new Date();
    this.countdownConfig.leftTime = Math.floor((this.booking.payment!.paymentLimit!.toDate().getTime() - new Date().getTime()) / 1000);
    if(this.booking.payment!.method==='SPEI'){
      this.countdownConfig.format = 'mm:ss';
    }
  }
  getPassengersText(counts: FlightFirebaseBooking["flightDetails"]["passengers"]["counts"]): string {
    const adults = counts.adults;
    const minors = (counts.childrens || 0) + (counts.infants || 0);

    let text = `${adults} Adulto${adults === 1 ? '' : 's'}`;
    if (minors > 0) {
      text += `, ${minors} Menor${minors === 1 ? '' : 'es'}`;
    } else {
      text += ' sin menores';
    }
    return text;
  }
}

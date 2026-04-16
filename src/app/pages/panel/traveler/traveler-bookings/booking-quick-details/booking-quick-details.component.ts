import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FirebaseBooking, FlightFirebaseBooking } from '../../../../../types/booking.types';
import { MatButtonModule } from '@angular/material/button';
import { CountdownModule, CountdownConfig } from 'ngx-countdown';
import { BookingDisplayService, BookingDisplaySummary } from '../../../../../services/booking-display.service';
import { getToneClass } from '../../../../../utils/booking-display.utils';

@Component({
  selector: 'app-booking-quick-details',
  imports: [
    MatIconModule, 
    CommonModule, 
    MatButtonModule, 
    CountdownModule
  ],
  templateUrl: './booking-quick-details.component.html',
  styleUrl: './booking-quick-details.component.scss'
})
export class BookingQuickDetailsComponent implements OnChanges {
  @Input() booking!: FirebaseBooking;
  activePayment:boolean = false;
  summary!: BookingDisplaySummary;
  paymentDeadline: Date | null = null;
  countdownConfig: CountdownConfig = {
    leftTime: 0,
    format: 'hh:mm:ss'
  };

  constructor(private display: BookingDisplayService){
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['booking'] || !this.booking) {
      return;
    }

    this.summary = this.display.buildSummary(this.booking);
    this.paymentDeadline = this.summary.paymentDeadline;
    this.activePayment = !!this.paymentDeadline && this.paymentDeadline > new Date() && this.summary.hasOutstandingBalance;

    if (this.paymentDeadline) {
      this.countdownConfig.leftTime = Math.floor((this.paymentDeadline.getTime() - new Date().getTime()) / 1000);
      this.countdownConfig.format = this.booking.payment?.method === 'SPEI' ? 'mm:ss' : 'hh:mm:ss';
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

  getBadgeClass(tone: BookingDisplaySummary['lifecycleTone']): string {
    return getToneClass(tone);
  }

  getHotelGuests(): number {
    return (this.booking.hotelDetails?.accomodation ?? []).reduce((acc, room) => {
      return acc + room.adults + (room.childrens ?? 0);
    }, 0);
  }

  getPaymentUrl(): string {
    return `/reservar/realizar-pago/${this.booking.bookingID}`;
  }

  getDetailsUrl(): string {
    return `/confirmacion/${this.booking.bookingID}`;
  }

  toDate(value: unknown): Date | null {
    if (!value) return null;
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
  }
}

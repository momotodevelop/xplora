import { Pipe, PipeTransform } from '@angular/core';
import { BookingStatus } from './types/booking.types';
import { getBookingStatusLabel } from './utils/booking-display.utils';

@Pipe({
  name: 'bookingStatus',
  standalone: true
})
export class BookingStatusPipe implements PipeTransform {
  transform(value: BookingStatus | string | null | undefined): string {
    return getBookingStatusLabel(value);
  }
}

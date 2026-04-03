import { Pipe, PipeTransform } from '@angular/core';
import { BookingTypes } from './types/booking.types';

@Pipe({
  name: 'bookingType',
  standalone: true
})
export class BookingTypePipe implements PipeTransform {
  transform(value: BookingTypes | string | null | undefined): string {
    const labels: Record<BookingTypes, string> = {
      FLIGHT: 'Vuelo',
      HOTEL: 'Hotel',
      TRANSPORTATION: 'Transporte',
      ACTIVITY: 'Actividad',
      CAR_RENTAL: 'Renta de auto',
      CRUISE: 'Crucero',
      PACKAGE: 'Paquete'
    };

    const key = (value || '').toUpperCase() as BookingTypes;
    return labels[key] ?? 'Otro';
  }
}

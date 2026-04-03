import { Pipe, PipeTransform } from '@angular/core';
import { BookingStatus } from './types/booking.types';

@Pipe({
  name: 'bookingStatus',
  standalone: true
})
export class BookingStatusPipe implements PipeTransform {
  transform(value: BookingStatus | string | null | undefined): string {
    const labels: Record<BookingStatus, string> = {
      CONFIRMED: 'Confirmada',
      PENDING: 'Pendiente',
      HOLD: 'En espera',
      CANCELED: 'Cancelada',
      REJECTED: 'Rechazada',
      VALIDATING: 'Validando'
    };

    const key = (value || '').toUpperCase() as BookingStatus;
    return labels[key] ?? 'Desconocido';
  }
}

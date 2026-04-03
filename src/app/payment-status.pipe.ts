import { Pipe, PipeTransform } from '@angular/core';
import { PaymentStatus } from './types/booking.types';

@Pipe({
  name: 'paymentStatus',
  standalone: true
})
export class PaymentStatusPipe implements PipeTransform {
  transform(value: PaymentStatus | string | null | undefined, getCssClass: boolean = false): string {
    const labels: Record<PaymentStatus, string> = {
      PENDING: 'Pendiente',
      COMPLETED: 'Completado',
      FAILED: 'Fallido',
      CANCELED: 'Cancelado',
      VALIDATING: 'Validando'
    };

    const classes: Record<PaymentStatus, string> = {
      PENDING: 'bg-warning text-dark',
      COMPLETED: 'bg-success',
      FAILED: 'bg-danger',
      CANCELED: 'bg-warning',
      VALIDATING: 'bg-info'
    };

    const key = (value || '').toUpperCase() as PaymentStatus;
    if (getCssClass) {
      return 'badge '+(classes[key] ?? 'bg-secondary');
    }
    return labels[key] ?? 'Desconocido';
  }
}

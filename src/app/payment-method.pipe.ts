import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paymentMethod',
  standalone: true
})
export class PaymentMethodPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const key = (value || '').toUpperCase();

    const labels: Record<string, string> = {
      CARD: 'Tarjeta',
      CASH: 'Efectivo',
      SPEI: 'Transferencia SPEI',
      PAYPAL: 'PayPal'
    };

    return labels[key] ?? 'Otro';
  }
}

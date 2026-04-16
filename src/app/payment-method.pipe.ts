import { Pipe, PipeTransform } from '@angular/core';
import { getPaymentMethodLabel } from './utils/booking-display.utils';

@Pipe({
  name: 'paymentMethod',
  standalone: true
})
export class PaymentMethodPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return getPaymentMethodLabel(value);
  }
}

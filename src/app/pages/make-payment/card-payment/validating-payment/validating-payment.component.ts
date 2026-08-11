import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FirebaseBooking } from '../../../../types/booking.types';

@Component({
  selector: 'app-validating-payment',
  imports: [CommonModule],
  templateUrl: './validating-payment.component.html',
  styleUrl: './validating-payment.component.scss'
})
export class ValidatingPaymentComponent {
  @Input() booking?: FirebaseBooking;

  get kycUrl(): string | null {
    return this.booking?.payment?.flowCheckout?.kyc?.url || null;
  }

  get requiresIdentityVerification(): boolean {
    return Boolean(this.kycUrl);
  }

}

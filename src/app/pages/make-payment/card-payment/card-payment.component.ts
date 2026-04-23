import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FirebaseBooking } from '../../../types/booking.types';
import { FlowRedirectPaymentComponent } from './flow-redirect-payment/flow-redirect-payment.component';
import { RetryXploraGatewayComponent } from './retry-xplora-gateway/retry-xplora-gateway.component';

@Component({
  selector: 'app-card-payment',
  imports: [FlowRedirectPaymentComponent, RetryXploraGatewayComponent],
  templateUrl: './card-payment.component.html',
  styleUrl: './card-payment.component.scss'
})
export class CardPaymentComponent {
  @Input() booking!: FirebaseBooking;
  @Input() skipMethodSelector = false;
  @Output() paymentProcessed = new EventEmitter<void>();

  processingPayment(){
    this.paymentProcessed.emit();
  };
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FirebaseBooking } from '../../../types/booking.types';
import { RetryXploraGatewayComponent } from './retry-xplora-gateway/retry-xplora-gateway.component';
import { XploraGatewayComponent } from '../../../shared/xplora-gateway/xplora-gateway.component';

@Component({
  selector: 'app-card-payment',
  imports: [RetryXploraGatewayComponent, XploraGatewayComponent],
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

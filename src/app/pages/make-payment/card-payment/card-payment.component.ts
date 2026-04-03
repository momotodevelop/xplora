import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FirebaseBooking } from '../../../types/booking.types';
import { ClipCardElementComponent } from './clip-card-element/clip-card-element.component';
import { XploraCardServicesService } from '../../../services/xplora-card-services.service';
import { StripeCardElementComponent } from './stripe-card-element/stripe-card-element.component';
import { RetryXploraGatewayComponent } from './retry-xplora-gateway/retry-xplora-gateway.component';
import { XploraCardElementComponent } from './xplora-card-element/xplora-card-element.component';
import { PaypalPaymentComponent } from './paypal-payment/paypal-payment.component';

@Component({
  selector: 'app-card-payment',
  imports: [ClipCardElementComponent, StripeCardElementComponent, RetryXploraGatewayComponent, PaypalPaymentComponent],
  templateUrl: './card-payment.component.html',
  styleUrl: './card-payment.component.scss'
})
export class CardPaymentComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  @Output() paymentProcessed = new EventEmitter<void>();
  activePaymentMethod: 'CLIP' | 'STRIPE' | 'RETRY' | 'PAYPAL' = 'RETRY';
  disabledByFraudPrevention:boolean = false;
  constructor(){
    
  }
  ngOnInit(): void {
    console.log(this.booking);
  }
  paypalDisabled(){
    this.disabledByFraudPrevention = true;
    this.activePaymentMethod = 'RETRY';
  }
  processingPayment(){
    this.paymentProcessed.emit();
  };
}

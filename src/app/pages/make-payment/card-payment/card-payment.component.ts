import { Component, Input, OnInit } from '@angular/core';
import { FirebaseBooking } from '../../../types/booking.types';
import { ClipCardElementComponent } from './clip-card-element/clip-card-element.component';
import { XploraCardServicesService } from '../../../services/xplora-card-services.service';

@Component({
  selector: 'app-card-payment',
  imports: [ClipCardElementComponent],
  templateUrl: './card-payment.component.html',
  styleUrl: './card-payment.component.scss'
})
export class CardPaymentComponent {
  @Input() booking!: FirebaseBooking;
  constructor(){
    
  }
}

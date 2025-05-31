import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FirebaseBooking } from '../../../types/booking.types';

@Component({
  selector: 'app-spei-payment',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInput,
    MatFormFieldModule,
    CommonModule

  ],
  templateUrl: './spei-payment.component.html',
  styleUrl: './spei-payment.component.scss'
})
export class SpeiPaymentComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  locator: string = this.booking.created?.toDate().getTime().toString().slice(-7) || '';
  ngOnInit(): void {
    
  }
  copiarAlPortapapeles(text:string){
    this.booking.bookingID
  }
}

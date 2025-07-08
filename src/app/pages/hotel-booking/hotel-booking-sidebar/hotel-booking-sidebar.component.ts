import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HotelInfoBookingDetails } from '../../../types/booking.types';
import { HotelHandlerService } from '../../../services/hotel-handler.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Promo } from '../../../services/xplora-promos.service';
import { UppercaseDirective } from '../../../uppercase.directive';
import { Charge } from '../../booking-process/booking-sidebar/booking-sidebar.component';

@Component({
  selector: 'app-hotel-booking-sidebar',
  imports: [
    CommonModule, 
    MatFormFieldModule, 
    MatInput, 
    FormsModule, 
    ReactiveFormsModule, 
    MatButtonModule,
    UppercaseDirective
  ],
  templateUrl: './hotel-booking-sidebar.component.html',
  styleUrl: './hotel-booking-sidebar.component.scss'
})
export class HotelBookingSidebarComponent implements OnInit, OnChanges {
  @Input() charges: Charge[] = [];
  @Input() hotel!: HotelInfoBookingDetails;
  @Input() total!: number;
  @Input() guests!: {adults: number, childrens: number};
  @Input() dates: [Date, Date] = [new Date(), new Date()];
  @Input() rooms: number = 0;
  @Input() paymentType!: "NOW" | "DELAYED";
  @Input() paymentMethod!: "CARD" | "CASH" | "SPEI";
  @Input() promo?: Promo;
  @Input() dN!: {d:number, n:number}
  @Output() verifyPromo:EventEmitter<string> = new EventEmitter();
  promoInput: FormControl = new FormControl(null, [Validators.required, Validators.minLength(3)]);
  constructor(public hotelHandler: HotelHandlerService){
    //console.log(this.hotel.ratingCount);
  }
  ngOnInit(): void {
    //console.log(this.hotel);  
  }
  ngOnChanges(changes: SimpleChanges): void {
    //console.log(changes);
  }
  verify(){
    //console.log(this.promoInput.value);
    this.verifyPromo.emit(this.promoInput.value);
  }
}

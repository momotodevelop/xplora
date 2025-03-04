import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-hotel-booking-addon-transfer-charge-item',
  imports: [CommonModule],
  templateUrl: './hotel-booking-addon-transfer-charge-item.component.html',
  styleUrl: './hotel-booking-addon-transfer-charge-item.component.scss'
})
export class HotelBookingAddonTransferChargeItemComponent implements OnChanges {
  @Input() description!: string;
  @Input() unitPrice: number = 0;
  @Input() quantity: number = 0;
  @Input() measurementUnit?: string;
  total: number = 0;
  constructor(){}
  ngOnChanges() {
    this.total = this.unitPrice * this.quantity;
  }
}

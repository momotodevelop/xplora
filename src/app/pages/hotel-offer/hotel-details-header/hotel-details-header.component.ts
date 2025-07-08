import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-hotel-details-header',
  imports: [CommonModule],
  templateUrl: './hotel-details-header.component.html',
  styleUrl: './hotel-details-header.component.scss'
})
export class HotelDetailsHeaderComponent {
  @Input() address!:string;
  @Input() hotelName!:string;
  @Input() priceFrom!:number;
  @Output() goToRooms: EventEmitter<void> = new EventEmitter<void>();
}

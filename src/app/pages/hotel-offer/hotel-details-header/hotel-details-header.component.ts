import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

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
  
}

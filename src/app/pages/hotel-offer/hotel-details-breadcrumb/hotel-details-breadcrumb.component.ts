import { Component, Input } from '@angular/core';
import { HotelDetails } from '../../../types/lite-api.types';
export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-hotel-details-breadcrumb',
  imports: [],
  templateUrl: './hotel-details-breadcrumb.component.html',
  styleUrl: './hotel-details-breadcrumb.component.scss'
})
export class HotelDetailsBreadcrumbComponent {
  @Input() hotel!: HotelDetails;
  constructor(){
    
  }
}

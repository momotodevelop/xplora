import { Component, Input } from '@angular/core';
import { GoogleMapsService } from '../../../services/google-maps.service';
import { MatIconModule } from '@angular/material/icon';
import { CheckinCheckoutTimes } from '../../../types/lite-api.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-details-location',
  imports: [MatIconModule, CommonModule],
  templateUrl: './hotel-details-location.component.html',
  styleUrl: './hotel-details-location.component.scss'
})
export class HotelDetailsLocationComponent {
  @Input() lat!: number;
  @Input() lng!: number;
  @Input() address!: string;
  @Input() petsAllowed?: boolean;
  @Input() times?: CheckinCheckoutTimes;
  @Input() importantInfo?: string;
  showMoreInfo: boolean = false;
  constructor(public gMaps: GoogleMapsService){}
}

import { Component, Input, OnInit } from '@angular/core';
import { HotelDetails, HotelImage } from '../../../types/lite-api.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotel-details-photos',
  imports: [CommonModule],
  templateUrl: './hotel-details-photos.component.html',
  styleUrl: './hotel-details-photos.component.scss'
})
export class HotelDetailsPhotosComponent implements OnInit {
  @Input() photos!:HotelImage[];
  secondaryPhotos!:HotelImage[];
  mainPhoto!:HotelImage;
  constructor(){}
  ngOnInit(): void {
    this.secondaryPhotos = this.photos.filter(photo=>photo.defaultImage===false).slice(0,4);
    this.mainPhoto = this.photos.filter(photo=>photo.defaultImage===true)[0];
    this.mainPhoto.url
  }
}

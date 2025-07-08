import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HotelSidebarSearchDetailsComponent } from './hotel-sidebar-search-details/hotel-sidebar-search-details.component';
import { HotelSidebarFiltersComponent } from './hotel-sidebar-filters/hotel-sidebar-filters.component';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Hotel } from '../../../types/amadeus-hotels-response.types';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { HotelListResult } from '../../../types/lite-api.types';

@Component({
  selector: 'app-hotel-search-sidebar',
  imports: [HotelSidebarSearchDetailsComponent, HotelSidebarFiltersComponent, FontAwesomeModule, CommonModule],
  templateUrl: './hotel-search-sidebar.component.html',
  styleUrl: './hotel-search-sidebar.component.scss'
})
export class HotelSearchSidebarComponent {
  @Input() checkIn!:Date;
  @Input() checkOut!:Date;
  @Input() destination!:google.maps.places.Place;
  @Input() rooms!:number[][];
  @Input() hotelList!:HotelListResult[];
  @Input() activeAmenities!:string[];
  @Input() activeHotel?:string;
  filterIcon=faFilter;
  amenitiesList:string[] = [];
  hotel?:HotelListResult;
  constructor(private datePipe: DatePipe, private router: Router){
  }
  updateAmenities(amenities:string[]){
    this.amenitiesList = amenities
  }
  updateHotelFilter(hotel?:HotelListResult){
    this.hotel=hotel;
  }
  filter(){
    //console.log(this.hotel);
    const checkIn:string = this.datePipe.transform(this.checkIn, "YYYY-MM-dd")!;
    const checkOut:string = this.datePipe.transform(this.checkOut, "YYYY-MM-dd")!;
    const roomString:string = this.rooms.map(pair => pair.join(',')).join('_');
    let url:string = "resultados/hoteles/"+this.destination?.id+"/"+roomString+"/"+checkIn+"/"+checkOut+"?";
    if(this.amenitiesList.length>0){
      url+="amenities="+this.amenitiesList.join(",")
    }
    if(this.hotel){
      url+="hotel="+this.hotel.id
    }
    this.router.navigateByUrl(url);
  }
}

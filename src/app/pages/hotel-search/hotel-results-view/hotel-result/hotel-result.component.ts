import { Component, Input, OnInit } from '@angular/core';
import { HotelOffer, Offer } from '../../../../types/amadeus-hotel-offers-response.types';
import { CommonModule, DatePipe } from '@angular/common';
import { GooglePlacesService } from '../../../../services/google-places.service';
import { faBan, faBed, faCalendarTimes, faTag } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Distance, Hotel } from '../../../../types/amadeus-hotels-response.types';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { GoogleMapBottomsheetComponent } from '../../../../shared/google-map-bottomsheet/google-map-bottomsheet.component';
import { of } from 'rxjs';
import { HotelListResultDisplay } from '../../hotel-search.component';
import { HotelPriceManagerPipe } from '../../../../hotel-price-manager.pipe';
import { LiteApiService } from '../../../../services/lite-api.service';
import { FacilityDescription } from '../../../../types/lite-api.types';
import { HotelHandlerService } from '../../../../services/hotel-handler.service';

@Component({
  selector: 'app-hotel-result',
  imports: [CommonModule, HotelPriceManagerPipe, FontAwesomeModule, MatBottomSheetModule],
  templateUrl: './hotel-result.component.html',
  styleUrl: './hotel-result.component.scss',
  providers: [DatePipe]
})
export class HotelResultComponent implements OnInit{
  @Input() dN!:{ d: number, n: number };
  @Input() hotelResult!:HotelListResultDisplay;
  @Input() rooms!:number[][];
  @Input() dates!:Date[];
  bedIcon=faBed;
  cancelIcon=faCalendarTimes;
  discountIcon=faTag;
  waIcon=faWhatsapp;
  facilities!:FacilityDescription[];
  facilitiesArray:(string)[] = [];
  constructor(private places: GooglePlacesService, private lite: LiteApiService, private bs: MatBottomSheet, private datePipe: DatePipe, public hotelHandler:HotelHandlerService){
    
  }
  ngOnInit(): void {
    console.log(this.hotelResult.zip);
    this.lite.facilities.subscribe(facilities=>{
      if(facilities){
        this.facilities = facilities;
      }
      this.facilitiesArray = this.hotelResult.facilityIds.map(facility=>{
        return this.getFacility(facility);
      }).filter(facility=>facility!==undefined).filter(facility=>facility.length<15).slice(0,4);
    });
  }
  openMap(){
    this.bs.open(GoogleMapBottomsheetComponent, {panelClass: 'bottomsheet-no-padding', data: {lat: this.hotelResult.latitude, lng: this.hotelResult.longitude, name: this.hotelResult.name}});
  }
  getFacility(id: number):string|undefined{
    const facilityDescription = this.facilities.find(facility=>facility.facility_id===id);
    const translation = facilityDescription?.translation.find(translation=>translation.lang==='es')?.facility;
    if(!facilityDescription) return undefined;
    return translation ?? facilityDescription.facility;
  } 
  formatDistance(distance: Distance): string {
    if (distance.unit === 'KM') {
      if (distance.value < 1) {
        // Convert to meters if value is less than 1 KM
        const meters = distance.value * 1000;
        return `A ${Math.round(meters)} m de`;
      } else {
        // Keep value in kilometers
        return `A ${distance.value.toFixed(2)} KM de`;
      }
    }
    return 'Unidad desconocida';
  }
  openDetails(){
    const roomString:string = this.rooms.map(pair => pair.join(',')).join('_');
    const checkInString:string = this.datePipe.transform(this.dates[0], "yyyy-MM-dd")!;
    const checkOutString:string = this.datePipe.transform(this.dates[1], "yyyy-MM-dd")!;
    window.open("/resultados/hoteles/detalles/"+this.hotelResult.id+"?rooms="+roomString+"&checkIn="+checkInString+"&checkOut="+checkOutString, "_blank");
  }
}

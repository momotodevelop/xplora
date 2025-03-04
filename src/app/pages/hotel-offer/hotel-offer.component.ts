import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AmadeusHotelsService } from '../../services/amadeus-hotels.service';
import { GooglePlacesService } from '../../services/google-places.service';
import { SharedDataService } from '../../services/shared-data.service';
import { combineLatest, map } from 'rxjs';
import { HotelDetailsBreadcrumbComponent } from './hotel-details-breadcrumb/hotel-details-breadcrumb.component';
import { HotelDetailsHeaderComponent } from './hotel-details-header/hotel-details-header.component';
import { HotelDetailsPhotosComponent } from './hotel-details-photos/hotel-details-photos.component';
import { HotelDetailsGeneralInfoComponent } from './hotel-details-general-info/hotel-details-general-info.component';
import { HotelDetailsCheckAvailabilityComponent } from './hotel-details-check-availability/hotel-details-check-availability.component';
import { HotelDetailsRoomsComponent } from './hotel-details-rooms/hotel-details-rooms.component';
import { HotelDetailsReviewsComponent } from './hotel-details-reviews/hotel-details-reviews.component';
import { HotelDetailsLocationComponent } from './hotel-details-location/hotel-details-location.component';
import { Sentiments } from '../../types/amadeus-hotel-rating.types';
import { LiteApiService } from '../../services/lite-api.service';
import { HotelDetails, HotelDetailsResponse, HotelFullRate, HotelFullRatesResponse, HotelReview, HotelReviewsResponse, Occupancy } from '../../types/lite-api.types';
import { GoogleTranslationService } from '../../services/google-translation.service';
import { VisitCounterService } from '../../services/visit-counter.service';
export interface HotelOfferParams{
  hotelId:string;
}
export interface HotelOfferQueryParams{
  checkIn?:string;
  checkOut?:string;
  rooms?:string;
}
@Component({
  selector: 'app-hotel-offer',
  imports: [
    HotelDetailsBreadcrumbComponent,
    HotelDetailsHeaderComponent,
    HotelDetailsPhotosComponent,
    HotelDetailsGeneralInfoComponent,
    HotelDetailsCheckAvailabilityComponent,
    HotelDetailsRoomsComponent,
    HotelDetailsReviewsComponent,
    HotelDetailsLocationComponent
  ],
  templateUrl: './hotel-offer.component.html',
  styleUrl: './hotel-offer.component.scss'
})
export class HotelOfferComponent implements OnInit {
  amadeusSentiments?:Sentiments;
  rooms:number[][] = [[2,0]];
  details?:HotelDetails;
  rates?:HotelFullRate[];
  reviews?:HotelReview[];
  checkIn!:Date;
  checkOut!:Date;
  constructor(
    private route: ActivatedRoute, 
    private sharedService: SharedDataService,
    private liteHotels: LiteApiService,
    private translate: GoogleTranslationService,
    private hotelVisitCounter: VisitCounterService
  ){}
  ngOnInit(): void {
    this.sharedService.settBookingMode(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
      this.sharedService.setLoading(false);
    });
    combineLatest([this.route.params, this.route.queryParams]).subscribe(([p, q]) => {
      const params: HotelOfferParams = p as HotelOfferParams;
      const query: HotelOfferQueryParams = q as HotelOfferQueryParams;
    
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      let checkInDate: Date | null = query.checkIn ? new Date(query.checkIn) : null;
      let checkOutDate: Date | null = query.checkOut ? new Date(query.checkOut) : null;
    
      // Si checkIn está definido pero es inválido o en el pasado, lo ajustamos a hoy + 2 días
      if (!checkInDate || isNaN(checkInDate.getTime()) || checkInDate < today) {
        checkInDate = new Date(today);
        checkInDate.setDate(today.getDate() + 2);
      }
      
      // Si checkOut está definido pero es inválido o en el pasado, se ignora
      if (!checkOutDate || isNaN(checkOutDate.getTime()) || checkOutDate < today) {
        checkOutDate = null;
      }
    
      // Si solo hay checkOut, intentamos establecer checkIn como checkOut - 2 días
      if (checkOutDate && !checkInDate) {
        checkInDate = new Date(checkOutDate);
        checkInDate.setDate(checkOutDate.getDate() - 2);
    
        // Si checkIn quedó en el pasado, lo ajustamos a hoy
        if (checkInDate < today) {
          checkInDate = new Date(today);
        }
      }
    
      // Si solo hay checkIn, establecemos checkOut como mínimo al día siguiente
      if (checkInDate && !checkOutDate) {
        checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + 1);
      }
    
      // Asegurar que checkOut siempre sea después de checkIn
      if (checkInDate && checkOutDate && checkOutDate <= checkInDate) {
        checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkInDate.getDate() + 1);
      }
    
      // 🔹 Solución: Se asegura que checkInDate y checkOutDate no sean null usando el operador "??"
      if(!checkOutDate) {
        const cOD:Date = new Date();
        cOD.setDate(checkInDate.getDate()+2);
        checkOutDate=cOD;
      }
      const checkIn = (checkInDate ?? new Date(today)).toISOString();
      const checkOut = (checkOutDate ?? new Date(today)).toISOString();
      const checkInStr = checkIn.split('T')[0];
      const checkOutStr = checkOut.split('T')[0];
      console.log(checkIn);
      console.log(checkOut);
      this.checkIn = new Date(checkInStr+"T12:00:00");
      this.checkOut = new Date(checkOutStr+"T12:00:00");

      this.rooms = query.rooms?.split('_').map(pair => pair.split(',').map(Number)) ?? [[2, 0]];
      this.hotelVisitCounter.incrementHotelVisit(params.hotelId);
    
      const occupancy: Occupancy[] = this.rooms.map(room => {
        let cIndex = 0;
        const childrenArray: number[] = [];
        if (room[1] !== undefined && room[1] > 0) {
          while (cIndex < room[1]) {
            childrenArray.push(7);
            cIndex++;
          }
        }
        return {
          adults: room[0],
          children: childrenArray.length > 0 ? childrenArray : undefined,
        };
      });
    
      console.log(occupancy);
    
      const requests = [
        this.liteHotels.getHotelDetails(params.hotelId),
        this.liteHotels.getRates([params.hotelId], occupancy, [checkInStr, checkOutStr]),
        this.liteHotels.getHotelReviews(params.hotelId),
      ];
    
      combineLatest(requests).subscribe(data => {
        const details = data[0] as HotelDetailsResponse;
        const rates = data[1] as HotelFullRatesResponse;
        const reviews = data[2] as HotelReviewsResponse;
        this.details = details.data;
        this.rates = rates.data;
        this.reviews = reviews.data;
        console.log(this.details);
        console.log(rates.data);
        console.log(reviews.data);
      });
    });            
  }
}

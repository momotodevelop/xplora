import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { HotelDetailsLocationComponent } from './hotel-details-location/hotel-details-location.component';
import { Sentiments } from '../../types/amadeus-hotel-rating.types';
import { LiteApiService } from '../../services/lite-api.service';
import { HotelDetails, HotelDetailsResponse, HotelFullRate, HotelFullRatesResponse, HotelReview, HotelReviewsResponse, Occupancy } from '../../types/lite-api.types';
import { GoogleTranslationService } from '../../services/google-translation.service';
import { VisitCounterService } from '../../services/visit-counter.service';
import { Title } from '@angular/platform-browser';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { FacebookPixelService } from '../../services/facebook-pixel.service';
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
    HotelDetailsLocationComponent
  ],
  templateUrl: './hotel-offer.component.html',
  styleUrl: './hotel-offer.component.scss'
})
export class HotelOfferComponent implements OnInit {
  @ViewChild('roomsSection') roomsElement!: ElementRef;
  amadeusSentiments?:Sentiments;
  rooms:number[][] = [[2,0]];
  details?:HotelDetails;
  rates?:HotelFullRate[];
  reviews?:HotelReview[];
  checkIn!:Date;
  checkOut!:Date;
  minPrice:number = 0;
  bookingId!:string;
  constructor(
    private route: ActivatedRoute, 
    private sharedService: SharedDataService,
    private liteHotels: LiteApiService,
    private translate: GoogleTranslationService,
    private hotelVisitCounter: VisitCounterService,
    private router: Router,
    private meta: MetaHandlerService,
    private gtag: Analytics,
    private fbp: FacebookPixelService
  ){}
  ngOnInit(): void {
    this.meta.setMeta({
      title: "Xplora Travel || Detalles del Hotel",
      description: "Explora información detallada, habitaciones disponibles, tarifas y opiniones de huéspedes para el hotel seleccionado. Encuentra la mejor opción para tu estancia y reserva fácilmente con Xplora Travel.",
      image: 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fhotels.jpg?alt=media&token=7360a482-31e9-405f-abe5-59ab0e2bdf7c'
    })
    this.sharedService.setLoading(true);
    this.sharedService.setBookingMode(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
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
      //console.log(checkIn);
      //console.log(checkOut);
      this.checkIn = new Date(checkInStr+"T12:00:00");
      this.checkOut = new Date(checkOutStr+"T12:00:00");

      this.rooms = query.rooms?.split('_').map(pair => pair.split(',').map(Number)) ?? [[2, 0]];
      this.hotelVisitCounter.incrementHotelVisit(params.hotelId);
    
      const occupancy: Occupancy[] = this.ocuppancy
    
      //console.log(occupancy);
    
      const requests = [
        this.liteHotels.getHotelDetails(params.hotelId),
        this.liteHotels.getRates([params.hotelId], occupancy, [checkInStr, checkOutStr]),
        this.liteHotels.getHotelReviews(params.hotelId),
      ];
    
      combineLatest(requests).subscribe(data => {
        this.sharedService.setLoading(false);
        const details = data[0] as HotelDetailsResponse;
        this.meta.setMeta({
          title: `Xplora Travel || ${details.data.name}`,
          description: `Explora información detallada, habitaciones disponibles, tarifas y opiniones de huéspedes para ${details.data.name}. Encuentra la mejor opción para tu estancia y reserva fácilmente con Xplora Travel.`,
          image: details.data.main_photo ?? details.data.hotelImages[0].url
        });
        const rates = data[1] as HotelFullRatesResponse;
        const reviews = data[2] as HotelReviewsResponse;
        this.details = details.data;
        let viewItemData:any = {
          currency: 'MXN',
          value: this.minPrice,
          checkin: this.checkIn,
          checkout: this.checkOut,
          destination: this.details!.city,
          hotel: this.details!.name
        }
        if(rates){
          viewItemData.items = this.rates![0].roomTypes[0].rates.map(room=>{
            return {
              item_id: room.rateId,
              item_name: room.name,
              item_category: 'Hoteles',
              currency: 'MXN',
              price: room.retailRate.total[0].amount,
              number_of_adults: room.adultCount,
              number_of_children: room.childCount,
              start_date: this.checkIn,
              end_date: this.checkOut,
              destination: this.details!.name
            };
          });
        }
        logEvent(this.gtag, 'view_item', viewItemData);
        this.fbp.track('ViewContent');
        if(rates.data){
          this.rates = rates.data.map(rate=>{
            return {
              ...rate,
              hotelId: rate.hotelId,
              roomTypes: rate.roomTypes.sort((a,b)=>{
                return a.offerRetailRate.amount - b.offerRetailRate.amount;
              })
            }
          });
          if(rates.data.length>0){
            //console.log(rates.data);
            this.minPrice = Math.min(...rates.data.map(rate => rate.roomTypes[0].offerRetailRate.amount));
            //console.log("Min Price: ", this.minPrice);
          }
        }
        this.reviews = reviews.data;
        //console.log(this.details.petsAllowed);
        //console.log(rates.data);
        //console.log(reviews.data);
      });
    });            
  }
  checkAvailability(event:{checkIn: Date, checkOut: Date, rooms: number[][]}) {
    this.router.navigate([
      '/resultados',
      'hoteles',
      'detalles',
      this.details!.id
    ], {
      queryParams: {
        checkIn: event.checkIn.toISOString().split('T')[0],
        checkOut: event.checkOut.toISOString().split('T')[0],
        rooms: event.rooms.map(room => room.join(',')).join('_')
      }
    });
    this.rooms = event.rooms;
    this.checkIn = event.checkIn;
    this.checkOut = event.checkOut;
    this.sharedService.setLoading(true);
    this.liteHotels.getRates([this.details!.id], this.ocuppancy, [this.checkIn.toISOString().split('T')[0], this.checkOut.toISOString().split('T')[0]]).subscribe((response: HotelFullRatesResponse) => {
      if(response.data){
        this.rates = response.data.map(rate=>{
          return {
            ...rate,
            hotelId: rate.hotelId,
            roomTypes: rate.roomTypes.sort((a,b)=>{
              return a.offerRetailRate.amount - b.offerRetailRate.amount;
            })
          }
        });
        if(response.data.length>0){
          //console.log(response.data);
          this.minPrice = Math.min(...response.data.map(rate => rate.roomTypes[0].offerRetailRate.amount));
          //console.log("Min Price: ", this.minPrice);
        }
      }else{
        this.minPrice = 0;
        this.rates = undefined;
      }
      this.sharedService.setLoading(false);
      this.goToRoomsSection();
    });
  }
  get ocuppancy(){
    return this.rooms.map(room => {
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
  }
  goToRoomsSection() {
    //console.log(this.roomsElement);
    if (this.roomsElement!==undefined) {
      this.roomsElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

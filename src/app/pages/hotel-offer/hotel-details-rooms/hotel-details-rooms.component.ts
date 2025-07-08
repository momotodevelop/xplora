import { Component, CUSTOM_ELEMENTS_SCHEMA, Input, OnChanges, OnInit } from '@angular/core';
import { RateDisplay, RoomDetailsComponent } from './room-details/room-details.component';
import { HotelDetails, HotelFullRate, Rate, Room, RoomType } from '../../../types/lite-api.types';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { faMale, faUser } from '@fortawesome/free-solid-svg-icons';
import { BoardTypeDictionarie } from '../../../static/board-types.static';
import { FirebaseBooking } from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { Router } from '@angular/router';
import { Hotel } from '../../../types/amadeus-hotels-response.types';
import { NotAvailableRoomComponent } from './not-available-room/not-available-room.component';
import { SwiperDirective } from '../../../swiper.directive';
import { SwiperOptions } from 'swiper/types';
import { MatIconModule } from '@angular/material/icon';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { FacebookPixelService } from '../../../services/facebook-pixel.service';
export interface HotelRoomDisplay extends Room{
  offers?: RoomTypeDisplay[]
}
export interface RoomTypeDisplay extends RoomType{
  rates: RateDisplay[]
}
@Component({
  selector: 'app-hotel-details-rooms',
  imports: [RoomDetailsComponent, NotAvailableRoomComponent, SwiperDirective, MatIconModule],
  templateUrl: './hotel-details-rooms.component.html',
  styleUrl: './hotel-details-rooms.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HotelDetailsRoomsComponent implements OnChanges {
  @Input() details!: HotelDetails;
  @Input() rates!: HotelFullRate[];
  @Input() dates!:Date[];
  rooms: HotelRoomDisplay[] = [];
  naRooms: HotelRoomDisplay[] = [];
  config: SwiperOptions = {
    slidesPerView: 4,
    navigation: true,
    pagination: { clickable: true },
    breakpoints: {
      // when window width is >= 0px (mobile)
      0: {
        slidesPerView: 1
      },
      // when window width is >= 576px (sm)
      576: {
        slidesPerView: 2
      },
      // when window width is >= 768px (md)
      768: {
        slidesPerView: 3
      },
      // when window width is >= 992px (lg)
      992: {
        slidesPerView: 4
      }
    }
  };
  constructor(private booking: FireBookingService, private shared: SharedDataService, private router: Router, private gtag: Analytics, private fbp: FacebookPixelService){}
  ngOnChanges(): void {
    const allRooms:HotelRoomDisplay[] = this.details.rooms.map(room=>{
      const rates: Rate[] = [];
      const seenOffers = new Set<string>(); // Para evitar duplicar offers
      const offers: RoomTypeDisplay[] = [];
      const data = this.rates[0];
      data.roomTypes.forEach(rT=>{
        rT.rates.forEach(rate=>{
          if((rate.mappedRoomId===room.id)&&!seenOffers.has(rT.offerId)){
            offers.push({
              ...rT,
              rates: rT.rates.sort((a,b)=>{return a.occupancyNumber-b.occupancyNumber}).map(rate=>{
                const occupancyIcons:IconDefinition[] = [];
                while(rate.maxOccupancy>occupancyIcons.length){
                  occupancyIcons.push(faMale);
                }
                return {
                  ...rate,
                  occupancyIcons,
                  board: BoardTypeDictionarie.find(board=>board.id===rate.boardType)
                } as RateDisplay
              })
            });
            seenOffers.add(rT.offerId);
          }
        })
      });
      return {
        ...room,
        offers
      }
    });
    this.rooms = allRooms.filter(room=>room.offers).filter(room=>room.offers!.length>0).sort((a,b)=>{return a.offers![0].rates[0].retailRate.total[0].amount-b.offers![0].rates[0].retailRate.total[0].amount});
    this.naRooms = allRooms.filter(room=>!room.offers || room.offers.length===0);
    //console.log(this.naRooms);
  }
  createBooking(offer:RoomType){
    //console.log(this.dates);
    this.shared.setLoading(true);
    if(offer){
      const hotelImage = this.details.hotelImages!.find(image=>image.defaultImage) ?? this.details.hotelImages![0];
      const Booking:FirebaseBooking = {
        type: 'HOTEL',
        status: 'PENDING',
        hotelDetails: {
          checkin: this.dates[0], 
          checkout: this.dates[1],
          accomodation: offer.rates.map(rate=>{
            return {
              adults: rate.adultCount,
              childrens: rate.childCount,
              occupancyNumber: rate.occupancyNumber
            }
          }),
          hotel: {
            name: this.details.name,
            address: this.details.address ?? null,
            id: this.details.id,
            stars: this.details.starRating ?? null,
            image: hotelImage.urlHd ?? hotelImage.url,
            rating: this.details.rating ?? null,
            ratingCount: this.details.reviewCount ?? null,
            lat: this.details.location?.latitude,
            lng: this.details.location?.longitude,
            city: this.details.city,
            country: this.details.country
          },
          offer: {
            ...offer,
            rates: offer.rates.map(rate=>{
              return {
                name: rate.name,
                adultCount: rate.adultCount,
                boardName: rate.boardName,
                boardType: rate.boardType,
                childCount: rate.childCount,
                cancellationPolicies: rate.cancellationPolicies,
                commission: rate.commission[0],
                maxOccupancy: rate.maxOccupancy,
                occupancyNumber: rate.occupancyNumber,
                priceType: rate.priceType,
                rateId: rate.rateId,
                remarks: rate.remarks,
                retailRate: {
                  initialPrice: rate.retailRate.initialPrice[0],
                  suggestedSellingPrice: rate.retailRate.suggestedSellingPrice[0],
                  total: rate.retailRate.total[0]
                },
                mappedRoomId: rate.mappedRoomId
              }
            }),
          }
        }       
      }
      //console.log(Booking);
      this.booking.addBooking(Booking).then(ok=>{
        this.shared.setLoading(false);
        console.log(ok);
        const total = Booking.hotelDetails!.offer.rates.reduce((sum, rate) => sum + (rate.retailRate.total.amount || 0), 0);
        logEvent(this.gtag, 'begin_checkout', {
          currency: 'MXN',
          value: total,
          transaction_id: ok,
          number_of_adults: Booking.hotelDetails!.accomodation.reduce((sum, acc) => sum + (acc.adults || 0), 0),
          number_of_children: Booking.hotelDetails!.accomodation.reduce((sum, acc) => sum + (acc.childrens || 0), 0),
          items: Booking.hotelDetails!.offer.rates.map(offer=>{
            return {
              item_name: offer.name,
              item_category: "Hotel Room",
              item_list_name: Booking.hotelDetails!.hotel.name,
              item_list_id: Booking.hotelDetails!.hotel.id,
              price: offer.retailRate.total.amount,
              quantity: 1,
              currency: 'MXN',
              start_date: Booking.hotelDetails!.checkin.toString(),
              end_date: Booking.hotelDetails!.checkout.toString(),
              number_of_adults: offer.adultCount,
              number_of_children: offer.childCount
            }
          })
        });
        this.fbp.track('InitiateCheckout', {
          currency: 'MXN',
          value: total
        });
        this.router.navigate(['/reservar', 'hoteles', ok]);
        //window.location.href = url;  
      }).catch(err=>{
        console.error(err);
        this.shared.setLoading(false);
      });
    }
  }
}

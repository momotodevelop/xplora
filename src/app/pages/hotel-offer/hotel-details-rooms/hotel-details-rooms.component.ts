import { Component, Input, OnInit } from '@angular/core';
import { RateDisplay, RoomDetailsComponent } from './room-details/room-details.component';
import { HotelDetails, HotelFullRate, Rate, Room, RoomType } from '../../../types/lite-api.types';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { faMale, faUser } from '@fortawesome/free-solid-svg-icons';
import { BoardTypeDictionarie } from '../../../static/board-types.static';
import { FirebaseBooking } from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';
import { SharedDataService } from '../../../services/shared-data.service';
export interface HotelRoomDisplay extends Room{
  offers?: RoomTypeDisplay[]
}
export interface RoomTypeDisplay extends RoomType{
  rates: RateDisplay[]
}
@Component({
  selector: 'app-hotel-details-rooms',
  imports: [RoomDetailsComponent],
  templateUrl: './hotel-details-rooms.component.html',
  styleUrl: './hotel-details-rooms.component.scss'
})
export class HotelDetailsRoomsComponent implements OnInit {
  @Input() details!: HotelDetails;
  @Input() rates!: HotelFullRate[];
  @Input() dates!:Date[];
  rooms: HotelRoomDisplay[] = [];
  constructor(private booking: FireBookingService, private shared: SharedDataService){}
  ngOnInit(): void {
    this.rooms = this.details.rooms.map(room=>{
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
    console.log(this.dates);
  }
  createBooking(offer:RoomType){
    console.log(this.dates);
    this.shared.setLoading(true);
    if(offer){
      const hotelImage = this.details.hotelImages.find(image=>image.defaultImage) ?? this.details.hotelImages[0];
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
            address: this.details.address,
            id: this.details.id,
            stars: this.details.starRating,
            image: hotelImage.urlHd ?? hotelImage.url,
            rating: this.details.rating,
            ratingCount: this.details.reviewCount,
            lat: this.details.location.latitude,
            lng: this.details.location.longitude,
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
      console.log(Booking);
      this.booking.addBooking(Booking).then(ok=>{
        this.shared.setLoading(false);
        console.log(ok);  
      }).catch(err=>{
        this.shared.setLoading(false);
      });
    }
  }
}

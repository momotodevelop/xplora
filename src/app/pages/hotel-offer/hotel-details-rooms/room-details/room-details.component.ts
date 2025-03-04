import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HotelRoomDisplay, RoomTypeDisplay } from '../hotel-details-rooms.component';
import { BoardTypeDefinition, Rate, RoomType } from '../../../../types/lite-api.types';
import { GoogleTranslationService } from '../../../../services/google-translation.service';
import { TranslatePipe } from '../../../../translate.pipe';
import { CommonModule } from '@angular/common';
import { IconDefinition } from '@fortawesome/free-brands-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HotelPriceManagerPipe } from '../../../../hotel-price-manager.pipe';
import { BoardTypeDictionarie } from '../../../../static/board-types.static';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HotelFirebaseBookingService } from '../../../../services/hotel-firebase-booking.service';
export interface RateDisplay extends Rate{
  occupancyIcons:IconDefinition[],
  board?: BoardTypeDefinition
}
@Component({
  selector: 'app-room-details',
  imports: [TranslatePipe, CommonModule, FontAwesomeModule, HotelPriceManagerPipe, ReactiveFormsModule],
  templateUrl: './room-details.component.html',
  styleUrl: './room-details.component.scss',
  providers: [TranslatePipe, HotelPriceManagerPipe]
})
export class RoomDetailsComponent implements OnInit {
  @Input() room!:HotelRoomDisplay;
  @Input() checkIn!: Date;
  @Input() checkOut!: Date;
  @Output() selectedRoom: EventEmitter<RoomType> = new EventEmitter();
  cancelationLimit!:Date;
  nights:number = 2;
  rateForm!: FormGroup;
  activeOffer?:RoomTypeDisplay;
  constructor(private GoogleTranslate:GoogleTranslationService, private firebaseBooking:HotelFirebaseBookingService ){
  }
  ngOnInit(): void {
    this.activeOffer = this.room.offers?.[0];
    this.rateForm = new FormGroup({
      rate: new FormControl({value: this.activeOffer?.offerId ?? null, disabled: false})
    });
    console.log(this.checkIn);
    const cancelLimit = new Date(this.checkIn); // Crear una copia de la fecha
    cancelLimit.setDate(cancelLimit.getDate() - 1);
    this.cancelationLimit = cancelLimit;
    this.room = {
      ...this.room,
      offers: this.room.offers?.map(offer=>{
        return {
          ...offer,
          rates: offer.rates
        }
      })
    }
    console.log(this.room.offers![0].rates[0].board!.description.es);
    this.rateControl.valueChanges.subscribe(value=>{
      console.log(value);
      this.activeOffer = this.room.offers?.find(offer=>offer.offerId===value);
      console.log(this.activeOffer);
    });
    console.log(this.activeOffer?.offerRetailRate.amount);
  }
  selectRoomType(){
    this.selectedRoom.emit(this.activeOffer!);
  }
  getBoardTypeText(id: string, name: string){
    return BoardTypeDictionarie.find(bt=>bt.id===id)?.es ?? name;
  }
  get rateControl(){
    return this.rateForm.controls['rate'];
  }
}

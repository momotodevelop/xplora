import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Inject, Input, OnInit } from '@angular/core';
import { BottomSheetHeaderComponent } from '../bottom-sheet-header/bottom-sheet-header.component';
import { SwiperDirective } from '../../swiper.directive';
import { HotelRoomDisplay } from '../../pages/hotel-offer/hotel-details-rooms/hotel-details-rooms.component';
import { SwiperOptions } from 'swiper/types';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { FacilityTranslationService } from '../../services/facility-translation.service';
import { GoogleTranslationService } from '../../services/google-translation.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-room-details-popup',
  imports: [BottomSheetHeaderComponent, SwiperDirective, CommonModule, MatIconModule],
  templateUrl: './room-details-popup.component.html',
  styleUrl: './room-details-popup.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RoomDetailsPopupComponent implements OnInit {
  config: SwiperOptions = {
    slidesPerView: 1,
    navigation: true,
    loop: true,
    autoplay: {
      delay: 0
    }
  };
  description!:string;
  showMore:boolean = false;
  private ref = inject<MatBottomSheetRef<RoomDetailsPopupComponent>>(MatBottomSheetRef)
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public roomDetails: HotelRoomDisplay, 
    public facilityTranslate:FacilityTranslationService,
    private translate: GoogleTranslationService,
  ){
  }
  ngOnInit(): void {
    this.description = this.roomDetails.description;
    this.translate.translateV2(this.roomDetails.description, 'es').subscribe({
      next: (text)=>{
        //console.log(text);
        this.description = text.data.translations[0].translatedText;
      }
    })
  }
  close() {
    this.ref.dismiss();
  }
}

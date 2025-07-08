import { Component, Input } from '@angular/core';
import { HotelRoomDisplay } from '../hotel-details-rooms.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIconModule } from '@angular/material/icon';
import { FacilityTranslationService } from '../../../../services/facility-translation.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { RoomDetailsPopupComponent } from '../../../../shared/room-details-popup/room-details-popup.component';

@Component({
  selector: 'app-not-available-room',
  imports: [CommonModule, FontAwesomeModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './not-available-room.component.html',
  styleUrl: './not-available-room.component.scss'
})
export class NotAvailableRoomComponent {
  @Input() room!:HotelRoomDisplay;
  constructor(public facilityTranslate:FacilityTranslationService, private bs: MatBottomSheet){}
  openRoomDetails(){
    this.bs.open(RoomDetailsPopupComponent, {
      data: this.room,
      panelClass: 'custom-bottom-sheet'
    });
  }
}

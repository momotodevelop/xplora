import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { HotelRoomsSelectionSheetComponent } from '../../../shared/hotel-rooms-selection-sheet/hotel-rooms-selection-sheet.component';
import { HotelDateSelectionSheetComponent } from '../../../shared/hotel-date-selection-sheet/hotel-date-selection-sheet.component';

@Component({
  selector: 'app-hotel-details-check-availability',
  imports: [CommonModule, MatIconModule],
  templateUrl: './hotel-details-check-availability.component.html',
  styleUrl: './hotel-details-check-availability.component.scss'
})
export class HotelDetailsCheckAvailabilityComponent {
  constructor(private _bottomSheet: MatBottomSheet) { }
  @Input() minPrice!: number;
  @Input() checkIn!: Date;
  @Input() checkOut!: Date;
  @Input() rooms!: number[][];
  @Output() checkAvailability: EventEmitter<{checkIn:Date, checkOut:Date, rooms: number[][]}> = new EventEmitter();
  get roomSummary() {
    const totalRooms = this.rooms?.length || 0;
    let adults = 0;
    let children = 0;

    if (this.rooms) {
      this.rooms.forEach(room => {
        if (room.length > 0) {
          adults += room[0] || 0;
          children += room[1] || 0;
        }
      });
    }

    return {
      adults,
      children,
      rooms: totalRooms
    };
  }
  openRoomSelector(){
    this._bottomSheet.open(HotelRoomsSelectionSheetComponent, {panelClass: 'bottomsheet-no-padding', data: this.rooms}).afterDismissed().subscribe((result:number[][])=>{
      if(result!==undefined){
          this.rooms = result;
      }
    });
  }
  openHotelDateSelection(){
    this._bottomSheet.open(HotelDateSelectionSheetComponent, {data: {dates: [this.checkIn, this.checkOut]}}).afterDismissed().subscribe((data:{start:Date, end: Date})=>{
      if(data!==undefined){
        this.checkIn = data.start;
        this.checkOut = data.end;
      }
    });
  }
  makeSearch(){
    this.checkAvailability.emit({
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      rooms: this.rooms
    });
  }
}

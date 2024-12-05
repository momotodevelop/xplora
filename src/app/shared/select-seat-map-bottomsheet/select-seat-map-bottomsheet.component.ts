import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Deck, SeatElement } from '../../types/amadeus-seat-map.types';
import { SelectSeatMapComponent } from '../select-seat-map/select-seat-map.component';
import { PassengerValue } from '../../pages/booking-process/passengers/passengers.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SelectionDisplay } from '../../pages/booking-process/seats/seats.component';

@Component({
    selector: 'app-select-seat-map-bottomsheet',
    imports: [SelectSeatMapComponent, CommonModule, MatButtonModule],
    templateUrl: './select-seat-map-bottomsheet.component.html',
    styleUrl: './select-seat-map-bottomsheet.component.scss'
})
export class SelectSeatMapBottomsheetComponent {
  seat?: SeatElement;
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {deck: Deck, passenger: PassengerValue, selected:SelectionDisplay[]},
    private _bottomSheetRef: MatBottomSheetRef<SelectSeatMapBottomsheetComponent>
  ){
    console.log(this.data);
  }
  selectedSeat(seat:SeatElement){
    this.seat=seat;
    console.log(seat);
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  saveSelection(){
    this._bottomSheetRef.dismiss(this.seat);
  }
}

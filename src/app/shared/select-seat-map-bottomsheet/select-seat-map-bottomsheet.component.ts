import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Deck, SeatElement } from '../../types/amadeus-seat-map.types';
import { SelectSeatMapComponent } from '../select-seat-map/select-seat-map.component';
import { PassengerValue } from '../../pages/booking-process/passengers/passengers.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SelectionDisplay } from '../../pages/booking-process/seats/seats.component';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-select-seat-map-bottomsheet',
    imports: [SelectSeatMapComponent, CommonModule, MatButtonModule, XploraBottomSheetComponent],
    templateUrl: './select-seat-map-bottomsheet.component.html',
    styleUrl: './select-seat-map-bottomsheet.component.scss'
})
export class SelectSeatMapBottomsheetComponent {
  seat?: SeatElement;
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {decks: Deck[], passenger: PassengerValue, selected:SelectionDisplay[], travelerId?: string},
    private _bottomSheetRef: MatBottomSheetRef<SelectSeatMapBottomsheetComponent>
  ){
    //console.log(this.data);
  }
  selectedSeat(seat:SeatElement){
    this.seat=seat;
  }
  selectedSeatPrice() {
    const exactPricing = this.data.travelerId
      ? this.seat?.travelerPricing.find(price => price.travelerId === this.data.travelerId)
      : undefined;
    const sharedPricing = this.seat?.travelerPricing.find(price => price.travelerId === 'all');
    const pricing = exactPricing || sharedPricing || (this.seat?.provider === 'DUFFEL' ? undefined : this.seat?.travelerPricing[0]);
    return pricing?.price;
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  saveSelection(){
    this._bottomSheetRef.dismiss(this.seat);
  }
}

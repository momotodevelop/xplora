import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { Deck } from '../../types/amadeus-seat-map.types';

@Component({
  selector: 'app-select-seat-map-bottomsheet',
  standalone: true,
  imports: [],
  templateUrl: './select-seat-map-bottomsheet.component.html',
  styleUrl: './select-seat-map-bottomsheet.component.scss'
})
export class SelectSeatMapBottomsheetComponent {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: Deck,
    private _bottomSheetRef: MatBottomSheetRef<SelectSeatMapBottomsheetComponent>
  ){}
  close(){
    this._bottomSheetRef.dismiss();
  }
}

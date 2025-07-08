import { Component, Inject, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { BottomSheetHeaderComponent } from '../../../../shared/bottom-sheet-header/bottom-sheet-header.component';
import { HotelBookingAddonsTransfersComponent } from '../hotel-booking-addons-transfers/hotel-booking-addons-transfers.component';
interface TransfersBottomSheetData{
  hotelName: string;
  lat: number;
  lng: number;
  guests: number;
}
@Component({
  selector: 'app-hotel-booking-addons-transfers-sheet',
  imports: [BottomSheetHeaderComponent, HotelBookingAddonsTransfersComponent],
  templateUrl: './hotel-booking-addons-transfers-sheet.component.html',
  styleUrl: './hotel-booking-addons-transfers-sheet.component.scss'
})
export class HotelBookingAddonsTransfersSheetComponent implements OnInit {
  constructor(
    private bottomSheetRef: MatBottomSheetRef<HotelBookingAddonsTransfersSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: TransfersBottomSheetData
  ) {}
  close(){
    this.bottomSheetRef.dismiss();
  }
  ngOnInit(): void {
    //console.log(this.data);
  }
}

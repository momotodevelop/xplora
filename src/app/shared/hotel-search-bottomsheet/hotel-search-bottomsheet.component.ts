import { Component, inject, Inject } from '@angular/core';
import { HotelSidebarSearchDetailsComponent } from '../../pages/hotel-search/hotel-search-sidebar/hotel-sidebar-search-details/hotel-sidebar-search-details.component';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
export interface HotelBottomSheetInputData{
  rooms: number[][],
  checkIn: Date,
  checkOut: Date,
  destination: google.maps.places.Place
}
@Component({
  selector: 'app-hotel-search-bottomsheet',
  imports: [HotelSidebarSearchDetailsComponent],
  templateUrl: './hotel-search-bottomsheet.component.html',
  styleUrl: './hotel-search-bottomsheet.component.scss'
})
export class HotelSearchBottomsheetComponent {
  readonly dialogRef = inject(MatDialogRef<HotelSearchBottomsheetComponent>);
  constructor(@Inject(MAT_DIALOG_DATA) public data: HotelBottomSheetInputData){

  }
  onSearch(){
    this.dialogRef.close();
  }
}

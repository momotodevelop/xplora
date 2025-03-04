import { Component, Inject } from '@angular/core';
import { HotelSidebarFiltersComponent } from '../../pages/hotel-search/hotel-search-sidebar/hotel-sidebar-filters/hotel-sidebar-filters.component';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { BottomSheetHeaderComponent } from '../bottom-sheet-header/bottom-sheet-header.component';
import { HotelListResult } from '../../types/lite-api.types';
export interface FilterBottomsheetInputData{
  activeAmenities: string[],
  hotelList: HotelListResult[]
}
@Component({
  selector: 'app-hotel-filters-bottomsheet',
  imports: [HotelSidebarFiltersComponent, BottomSheetHeaderComponent],
  templateUrl: './hotel-filters-bottomsheet.component.html',
  styleUrl: './hotel-filters-bottomsheet.component.scss'
})
export class HotelFiltersBottomsheetComponent {
  selectedAmenities:string[]=[];
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data:FilterBottomsheetInputData){}
  updateAmenities(amenities:string[]){
    this.selectedAmenities=amenities;
  }
  close(){}
}

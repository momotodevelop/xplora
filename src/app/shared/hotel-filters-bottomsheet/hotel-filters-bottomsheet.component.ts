import { Component, Inject } from '@angular/core';
import { HotelSidebarFiltersComponent } from '../../pages/hotel-search/hotel-search-sidebar/hotel-sidebar-filters/hotel-sidebar-filters.component';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';
import { HotelListResult } from '../../types/lite-api.types';
export interface FilterBottomsheetInputData{
  activeAmenities: string[],
  hotelList: HotelListResult[]
}
@Component({
  selector: 'app-hotel-filters-bottomsheet',
  imports: [HotelSidebarFiltersComponent, XploraBottomSheetComponent],
  templateUrl: './hotel-filters-bottomsheet.component.html',
  styleUrl: './hotel-filters-bottomsheet.component.scss'
})
export class HotelFiltersBottomsheetComponent {
  selectedAmenities:string[]=[];
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data:FilterBottomsheetInputData){
    this.selectedAmenities = [...data.activeAmenities];
  }
  updateAmenities(amenities:string[]){
    this.selectedAmenities=amenities;
  }
  close(){}
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { HotelBottomSheetInputData, HotelSearchBottomsheetComponent } from '../../../../shared/hotel-search-bottomsheet/hotel-search-bottomsheet.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FilterBottomsheetInputData, HotelFiltersBottomsheetComponent } from '../../../../shared/hotel-filters-bottomsheet/hotel-filters-bottomsheet.component';
import { Hotel } from '../../../../types/amadeus-hotels-response.types';
import { HotelListResult } from '../../../../types/lite-api.types';

@Component({
  selector: 'app-hotel-results-header',
  imports: [CommonModule, MatBottomSheetModule, MatDialogModule],
  templateUrl: './hotel-results-header.component.html',
  styleUrl: './hotel-results-header.component.scss'
})
export class HotelResultsHeaderComponent {
  @Input() resultsCount!: number;
  @Input() checkIn!:Date;
  @Input() checkOut!:Date;
  @Input() rooms!:number[][];
  @Input() destination!:google.maps.places.Place;
  @Input() activeAmenitiesFilter!:string[];
  @Input() hotelList!:HotelListResult[];
  constructor(private bs: MatBottomSheet, private dialog: MatDialog){}
  openSearchHotelsBottomSheet(){
    const data: HotelBottomSheetInputData = {
      checkIn: this.checkIn,
      checkOut: this.checkOut,
      destination: this.destination,
      rooms: this.rooms
    }
    this.dialog.open(HotelSearchBottomsheetComponent, {data, panelClass: ['rounded-4','bottomsheet-no-padding']});
  }
  openFilterBottomsheet(){
    const data: FilterBottomsheetInputData = {
      activeAmenities: this.activeAmenitiesFilter,
      hotelList: this.hotelList
    }
    this.bs.open(HotelFiltersBottomsheetComponent, {data, panelClass: ['bottomsheet-no-padding']})
  }
}

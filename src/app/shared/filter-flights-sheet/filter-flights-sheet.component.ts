import { Component, Inject, OnInit } from '@angular/core';
import { FlightFiltersComponent } from '../flight-filters/flight-filters.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FilterOptions, FlightOffersDataHandlerService, SortOptions } from '../../services/flight-offers-data-handler.service';
import { FilterFormValue } from '../../pages/flight-search/sidebar/sidebar.component';
import { combineLatest, take } from 'rxjs';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-filter-flights-sheet',
    imports: [FlightFiltersComponent, MatBottomSheetModule, XploraBottomSheetComponent],
    templateUrl: './filter-flights-sheet.component.html',
    styleUrl: './filter-flights-sheet.component.scss'
})
export class FilterFlightsSheetComponent implements OnInit {
  filters?:FilterOptions;
  sorting?:SortOptions;
  estimatedResults?:number;
  formValue?:FilterFormValue;
  constructor(private ref: MatBottomSheetRef<FilterFlightsSheetComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: any, private flighOffersData:FlightOffersDataHandlerService){

  }
  ngOnInit(){
    combineLatest([this.flighOffersData.filters, this.flighOffersData.sorting]).pipe(take(1)).subscribe(([filters, sorting]) => {
      this.filters = filters ?? {};
      this.sorting = sorting ?? ['precio', 'asc'];
      this.estimatedResults = this.flighOffersData.getEstimatedResults(this.filters, this.sorting);
    });
  }
  updateFilterValue(value: {filters: FilterOptions, sorting: SortOptions}){
    this.filters = value.filters;
    this.sorting = value.sorting;
    this.estimatedResults = this.flighOffersData.getEstimatedResults(this.filters, this.sorting);
  }
  filter(){
    this.flighOffersData.filterOffers(this.filters ?? {}, this.sorting ?? ['precio', 'asc']);
    this.ref.dismiss(true);
  }
  close(){
    this.ref.dismiss(false);
  }
}

import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { CarrierOption, FilterOptions, FlightOffersDataHandlerService, SortOptions } from '../../../services/flight-offers-data-handler.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatSliderModule } from '@angular/material/slider';
import * as _ from 'lodash';
import { FeatherIconsModule } from '../../../modules/feather-icons/feather-icons.module';
import { FilterFlightsSheetComponent } from '../../../shared/filter-flights-sheet/filter-flights-sheet.component';
import { FlightFiltersComponent } from '../../../shared/flight-filters/flight-filters.component';
import { combineLatest, forkJoin } from 'rxjs';

export interface FilterFormValue {
  segments: boolean[], 
  airlines:boolean[], 
  orderBy:string, 
  price: {min:number, max:number},
  departureTime: "MORNING"|"AFTERNOON"|"EVENING",
  arrivalTime: "MORNING"|"AFTERNOON"|"EVENING"
}

@Component({
    selector: 'app-flight-search-sidebar',
    imports: [MatCheckboxModule, ReactiveFormsModule, TitleCasePipe, MatSliderModule, FeatherIconsModule, FilterFlightsSheetComponent, FlightFiltersComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    providers: []
})
export class SidebarComponent implements OnInit {
  constructor(private offersData:FlightOffersDataHandlerService){}

  ngOnInit(): void {
  }

  updateFilterValue(value: {filters: FilterOptions, sorting: SortOptions}){
    console.log(value);
  }
}

import { Component, OnInit } from '@angular/core';
import { FilterOptions, FlightOffersDataHandlerService, SortOptions } from '../../../services/flight-offers-data-handler.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import * as _ from 'lodash';
import { FeatherIconsModule } from '../../../modules/feather-icons/feather-icons.module';
import { FlightFiltersComponent } from '../../../shared/flight-filters/flight-filters.component';

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
    imports: [MatCheckboxModule, ReactiveFormsModule, MatSliderModule, FeatherIconsModule, FlightFiltersComponent],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    providers: []
})
export class SidebarComponent implements OnInit {
  constructor(private offersData:FlightOffersDataHandlerService){}

  ngOnInit(): void {
    
  }

  updateFilterValue(value: {filters: FilterOptions, sorting: SortOptions}){
    //console.log(value);
  }
}

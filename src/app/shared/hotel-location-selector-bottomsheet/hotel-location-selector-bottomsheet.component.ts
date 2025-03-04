import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { GooglePlacesService } from '../../services/google-places.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TitleCasePipe } from '@angular/common';
import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, stagger, animate, query } from '@angular/animations';

export interface LocationOption{
  text: string;
  secondaryText?: string;
  mainText?: string;
  placeId: string;
  types: string[];
  suggestion: google.maps.places.PlacePrediction; 
  distance?: number;

}

@Component({
  selector: 'app-hotel-location-selector-bottomsheet',
  imports: [MatBottomSheetModule, MatButtonModule, ScrollingModule, ReactiveFormsModule, TitleCasePipe, MatSnackBarModule],
  templateUrl: './hotel-location-selector-bottomsheet.component.html',
  styleUrl: './hotel-location-selector-bottomsheet.component.scss',
  animations: [
    trigger('listAnimation', [
        transition('* <=> *', [
            query(':enter', [style({ opacity: 0, transform: 'translateY(-15px)' }), stagger('100ms', animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })))], { optional: true })
        ])
    ])
]
})
export class HotelLocationSelectorBottomsheetComponent implements OnInit {
  searchInput:FormControl = new FormControl('');
  constructor(private places: GooglePlacesService, private _ref: MatBottomSheetRef<HotelLocationSelectorBottomsheetComponent>){}
  options?:LocationOption[];
  ngOnInit(): void {
    this.searchInput.valueChanges.pipe(debounceTime(200)).subscribe(value=>{
      if(this.searchInput.valid&&value.length>0){
        this.places.fetchAutocompleteSuggestions(value).then(results =>{
          this.options = results.map(result=>{
            return {
              text: result.placePrediction!.text.text,
              mainText: result.placePrediction!.mainText?.text ?? undefined,
              secondaryText: result.placePrediction!.secondaryText?.text ?? undefined,
              distance: result.placePrediction!.distanceMeters ?? undefined,
              placeId: result.placePrediction!.placeId,
              types: result.placePrediction!.types,
              suggestion: result.placePrediction!
            };
          });
          console.log(this.options)
        });
      }
    })
  }
  selectPlace(suggestion:google.maps.places.PlacePrediction){
    this._ref.dismiss(suggestion);
  }
}

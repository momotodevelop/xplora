import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LocationSelectionSheetComponent } from '../../../shared/location-selection-sheet/location-selection-sheet.component';
import { PaxSelectionSheetComponent } from '../../../shared/pax-selection-sheet/pax-selection-sheet.component';
import { AmadeusLocation } from '../../../types/amadeus-airport-response.types';
import { FormGroup, FormControl } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FlightDateSelectionSheetComponent } from '../../../shared/flight-date-selection-sheet/flight-date-selection-sheet.component';
import { AmadeusAuthService } from '../../../services/amadeus-auth.service';
import { AirportSearchService } from '../../../services/airport-search.service';
import { DirectDestination } from '../../../types/amadeus-direct-airport-response.types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
export interface Passengers{
  adults:number;
  childrens:number;
  infants:number;
}
@Component({
  selector: 'app-search',
  standalone: false,
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent {
  passengers:Passengers={
    adults:1,
    childrens:0,
    infants:0,
  };
  passengersTotal:number=this.passengers.adults+this.passengers.childrens+this.passengers.infants;
  origin!:AmadeusLocation|undefined;
  destination!:AmadeusLocation|undefined;
  originInput: FormControl<string|null> = new FormControl(null);
  destinationInput: FormControl<string|null> = new FormControl(null)
  activeTab:number=1;
  dates!: Date[];
  round: boolean = true;
  sugestedDestinations!:DirectDestination[];
  constructor(private _bottomSheet: MatBottomSheet, private titlecase: TitleCasePipe, private token: AmadeusAuthService, private locations: AirportSearchService, private snackBar: MatSnackBar, private datepipe: DatePipe, private router: Router) {}
  openLocationBottomSheet(isOrigin:boolean): void {
    this._bottomSheet.open(LocationSelectionSheetComponent, {data: {isOrigin, suggestedDestinations: this.sugestedDestinations}, panelClass: "locationSelectionSheet"}).afterDismissed().subscribe((location:AmadeusLocation)=>{
      if(location!==undefined){
        if(isOrigin){
          this.origin=location;
          this.originInput.setValue((location.subType==="AIRPORT"?("Aeropuerto de "+this.titlecase.transform(location.address.cityName)+" ("+location.iataCode+")"):(this.titlecase.transform(location.address.cityName)+", "+this.titlecase.transform(location.address.countryName)+" (Todos los aeropuertos)")));
          this.destinationInput.disable();
          this.token.getToken().subscribe({
            next: (token) => {
              if(token!==null){
                this.locations.searchDirectDestinations(location.iataCode, token).subscribe({
                  next: (directDestinations) => {
                    this.sugestedDestinations = directDestinations.data;
                    this.destinationInput.enable();
                  },
                  error: (err) => {
                    this.destinationInput.enable()
                  }
                })
              }
            },
            error: (err) => {
              this.destinationInput.enable();
            }
          });
        }else{
          this.destination=location;
          this.destinationInput.setValue((location.subType==="AIRPORT"?("Aeropuerto de "+this.titlecase.transform(location.address.cityName)+" ("+location.iataCode+")"):(this.titlecase.transform(location.address.cityName)+", "+this.titlecase.transform(location.address.countryName)+" (Todos los aeropuertos)")));
        }
      }else{
        if(isOrigin){
          this.origin=undefined;
          this.originInput.setValue(null);
        }else{
          this.destination=undefined;
          this.destinationInput.setValue(null);
        }
      }
    });
  }
  openPaxBottomSheet(){
    this._bottomSheet.open(PaxSelectionSheetComponent, {data: [this.passengers.adults, this.passengers.childrens, this.passengers.infants]}).afterDismissed().subscribe(paxes=>{
      if(paxes!==undefined){
        this.passengers.adults=paxes[0];
        this.passengers.childrens=paxes[1];
        this.passengers.infants=paxes[2];
        this.passengersTotal=this.passengers.adults+this.passengers.childrens+this.passengers.infants;
      }
    });
  }
  openDateSelection(round:boolean, dates: Date[]){
    this._bottomSheet.open(FlightDateSelectionSheetComponent, {data: {round, dates}}).afterDismissed().subscribe((data:{round: boolean, start: Date, end?:Date})=>{
      if(data!==undefined){
        if(data.round){
          this.round = data.round;
          this.dates = [data.start, (data.end as Date)];
        }else{
          this.round = data.round;
          this.dates = [data.start];
        }
      }
    });
  }
  searchFlights(){
    if(this.areTravelParamsDefined()){
      const url:string = "resultados/vuelos/"
      +(this.origin?.subType==="AIRPORT"?'A':'C')+this.origin?.iataCode+"/"
      +(this.destination?.subType==="AIRPORT"?'A':'C')+this.destination?.iataCode+"/"
      +this.datepipe.transform(this.dates[0], "YYYY-MM-dd")+"/"
      +(this.round?this.datepipe.transform(this.dates[0], "YYYY-MM-dd"):"NA")+"/"
      +this.passengers.adults.toString()+"/"
      +(this.passengers.childrens.toString())+"/"
      +this.passengers.infants.toString()+"/ECONOMY";
      console.log(url);
      this.router.navigateByUrl(url);
    }
    
  }
  areTravelParamsDefined(): boolean {
    if (this.origin !== undefined && this.destination !== undefined && this.dates !== undefined) {
      console.log(`Todos los parámetros están definidos: origin = ${this.origin}, destination = ${this.destination}, dates = ${this.dates}`);
      return true;
    } else {
      if (this.dates === undefined) {
        console.warn('dates es undefined.');
        this.snackBar.open("Elige una fecha para tu vuelo", undefined, {duration: 1500});
      }
      if (this.destination === undefined) {
        console.warn('destination es undefined.');
        this.snackBar.open("Elige un destino para tu vuelo", undefined, {duration: 1500});
      }
      if (this.origin === undefined) {
        console.warn('origin es undefined.');
        this.snackBar.open("Elige un origen para tu vuelo", undefined, {duration: 1500});
      }
      return false;
    }
  }
}

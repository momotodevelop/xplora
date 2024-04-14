import { Component, Input, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { FormControl, FormsModule } from '@angular/forms';
import { FlightClassSelectionDialogComponent } from '../../../shared/flight-class-selection-dialog/flight-class-selection-dialog.component';
import { AmadeusLocation } from '../../../types/amadeus-airport-response.types';
import { Passengers } from '../../home/search/search.component';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LocationSelectionSheetComponent } from '../../../shared/location-selection-sheet/location-selection-sheet.component';
import { AmadeusAuthService } from '../../../services/amadeus-auth.service';
import { AirportSearchService } from '../../../services/airport-search.service';
import { DirectDestination } from '../../../types/amadeus-direct-airport-response.types';
import { PaxSelectionSheetComponent } from '../../../shared/pax-selection-sheet/pax-selection-sheet.component';
export type FlightClassType = "ECONOMY"|"PREMIUM_ECONOMY"|"BUSINESS"|"FIRST";
export interface FlightClass {
  name: string, 
  id: FlightClassType
}
export const flightClasses:FlightClass[]=[
  { name: 'Económica', id: 'ECONOMY' },
  { name: 'Económica Premium', id: 'PREMIUM_ECONOMY' },
  { name: 'Ejecutiva', id: 'BUSINESS' },
  { name: 'Primera Clase', id: 'FIRST' }
]

@Component({
  selector: 'app-flight-search-topbar',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatCheckboxModule, FormsModule, MatDialogModule, DatePipe, TitleCasePipe],
  templateUrl: './search-topbar.component.html',
  styleUrl: './search-topbar.component.scss',
  providers: [DatePipe, TitleCasePipe]
})
export class SearchTopbarComponent implements OnInit {
  @Input() origin!: AmadeusLocation;
  @Input() destination!: AmadeusLocation;
  @Input() passengers!: Passengers;
  @Input() departure!: Date;
  @Input() return: Date|undefined;
  @Input() flightClass!:string;
  dates: Date[] = [];
  round:boolean=true;
  flightClasses:FlightClass[]=flightClasses;
  allFlightClassSelected = false;
  indeterminateFlightClassSelected = false;
  selectedFlightClass: FlightClass = { name: 'Económica', id: 'ECONOMY' };
  originInput:FormControl = new FormControl(undefined);
  destinationInput: FormControl = new FormControl(undefined);
  suggestedDestinations:DirectDestination[]=[];
  constructor(private dialog: MatDialog, private bottomSheet: MatBottomSheet, private token: AmadeusAuthService, private titlecase: TitleCasePipe, private locations: AirportSearchService){}
  ngOnInit(): void {
    console.log(this.origin);
    console.log(this.destination);
    console.log(this.departure);
    console.log(this.return);
    console.log(this.passengers);
    this.round=this.return!==undefined;
    this.dates = [this.departure];
    console.log(this.flightClass);
    const filteredClasses=this.flightClasses.filter(classF=>classF.id===this.flightClass as FlightClassType);
    console.log(filteredClasses);
    if(filteredClasses.length>0){
      this.selectedFlightClass=filteredClasses[0];      
    }
    if(this.round){
      this.dates.push(this.return as Date);
    }
  }
  // Actualizar el estado de todos los checkboxes
  updateRound(round:boolean){
    this.round=round;
  }
  updateFlightClass(classID:string){
    const filteredClasses:FlightClass[]=this.flightClasses.filter(classF=>classF.id===classID);
    if(filteredClasses.length>0) this.selectedFlightClass=filteredClasses[0];
  }
  openLocationBottomSheet(isOrigin:boolean): void {
    this.bottomSheet.open(LocationSelectionSheetComponent, {data: {isOrigin, suggestedDestinations: this.suggestedDestinations}, panelClass: "locationSelectionSheet"}).afterDismissed().subscribe((location:AmadeusLocation)=>{
      if(location!==undefined){
        if(isOrigin){
          this.origin=location;
          this.originInput.setValue((location.subType==="AIRPORT"?("Aeropuerto de "+this.titlecase.transform(location.address.cityName)+" ("+location.iataCode+")"):(this.titlecase.transform(location.address.cityName)+", "+this.titlecase.transform(location.address.countryName)+" (Todos los aeropuertos)")));
          this.token.getToken().subscribe({
            next: (token) => {
              if(token!==null){
                this.locations.searchDirectDestinations(location.iataCode, token).subscribe({
                  next: (directDestinations) => {
                    this.suggestedDestinations = directDestinations.data;
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
        /* if(isOrigin){
          this.origin=undefined;
          this.originInput.setValue(null);
        }else{
          this.destination=undefined;
          this.destinationInput.setValue(null);
        } */
      }
    });
  }
  openPaxBottomSheet(){
    this.bottomSheet.open(PaxSelectionSheetComponent, {data: [this.passengers.adults, this.passengers.childrens, this.passengers.infants]}).afterDismissed().subscribe(paxes=>{
      if(paxes!==undefined){
        this.passengers.adults=paxes[0];
        this.passengers.childrens=paxes[1];
        this.passengers.infants=paxes[2];
      }
    });
  }
}

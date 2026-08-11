import { Component, inject, Input, OnInit } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { FormControl, FormsModule } from '@angular/forms';
import { FlightClassSelectionDialogComponent } from '../../../shared/flight-class-selection-dialog/flight-class-selection-dialog.component';
import { AmadeusLocation } from '../../../types/amadeus-airport-response.types';
import { Passengers } from '../../home/search/search.component';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { LocationSelectionSheetComponent } from '../../../shared/location-selection-sheet/location-selection-sheet.component';
import { AirportSearchService } from '../../../services/airport-search.service';
import { DirectDestination } from '../../../types/amadeus-direct-airport-response.types';
import { PaxSelectionSheetComponent } from '../../../shared/pax-selection-sheet/pax-selection-sheet.component';
import { LocationNamePipe } from '../../../city-name.pipe';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { FlightDateSelectionSheetComponent } from '../../../shared/flight-date-selection-sheet/flight-date-selection-sheet.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { FacebookPixelService } from '../../../services/facebook-pixel.service';
import { SharedDataService } from '../../../services/shared-data.service';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
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
    imports: [MatMenuModule, MatIconModule, MatCheckboxModule, FormsModule, MatDialogModule, DatePipe, TitleCasePipe, LocationNamePipe, CommonModule],
    templateUrl: './search-topbar.component.html',
    styleUrl: './search-topbar.component.scss',
    providers: [DatePipe, TitleCasePipe],
    animations: [
      trigger('searchPanel', [
        transition(':enter', [
          style({opacity: 0, transform: 'translateY(-14px)'}),
          animate('280ms cubic-bezier(.2,.8,.2,1)', style({opacity: 1, transform: 'translateY(0)'}))
        ]),
        transition(':leave', [
          animate('180ms ease-in', style({opacity: 0, transform: 'translateY(-10px)'}))
        ])
      ]),
      trigger('searchSummary', [
        transition(':enter', [
          style({opacity: 0, transform: 'translateY(-8px) scale(.985)'}),
          animate('240ms ease-out', style({opacity: 1, transform: 'translateY(0) scale(1)'}))
        ])
      ])
    ]
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
  minimized:boolean = true;
  destroyed = new Subject<void>();
  currentScreenSize?: string;
  // Create a map to display breakpoint names for demonstration purposes.
  displayNameMap = new Map([
    [Breakpoints.XSmall, 'XSmall'],
    [Breakpoints.Small, 'Small'],
    [Breakpoints.Medium, 'Medium'],
    [Breakpoints.Large, 'Large'],
    [Breakpoints.XLarge, 'XLarge'],
  ]);
  constructor(
    private snackBar: MatSnackBar,
    private gtag: Analytics,
    private bottomSheet: MatBottomSheet,
    private titlecase: TitleCasePipe,
    private locations: AirportSearchService,
    private fbp: FacebookPixelService,
    private shared: SharedDataService,
    private router: Router,
    private datepipe: DatePipe,
  ) {
    inject(BreakpointObserver)
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .pipe(takeUntil(this.destroyed))
      .subscribe(result => {
        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this.currentScreenSize = this.displayNameMap.get(query) ?? 'Unknown';
            if(this.currentScreenSize==='Medium'||this.currentScreenSize==='Large'||this.currentScreenSize==='XLarge'){
              this.minimized = false;
            }else{
              this.minimized = true;
            }
          }
        }
      });
  }
  ngOnInit(): void {
    //console.log(this.origin);
    //console.log(this.destination);
    //console.log(this.departure);
    //console.log(this.return);
    //console.log(this.passengers);
    this.round=this.return!==undefined;
    this.dates = [this.departure];
    
    //console.log(this.flightClass);
    const filteredClasses=this.flightClasses.filter(classF=>classF.id===this.flightClass as FlightClassType);
    //console.log(filteredClasses);
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
  toggleMinimized(){
    this.minimized=!this.minimized;
  }
  get totalPassengers(){
    return this.passengers.adults+this.passengers.childrens+this.passengers.infants;
  }
  openLocationBottomSheet(isOrigin:boolean): void {
    this.bottomSheet.open(LocationSelectionSheetComponent, {
      data: {
        isOrigin,
        suggestedDestinations: this.suggestedDestinations,
        excludedIataCode: isOrigin ? undefined : this.origin?.iataCode
      },
      panelClass: "locationSelectionSheet"
    }).afterDismissed().subscribe((location:AmadeusLocation)=>{
      if(location!==undefined){
        if(isOrigin){
          this.origin=location;
          this.originInput.setValue((location.subType==="AIRPORT"?("Aeropuerto de "+this.titlecase.transform(location.address.cityName)+" ("+location.iataCode+")"):(this.titlecase.transform(location.address.cityName)+", "+this.titlecase.transform(location.address.countryName)+" (Todos los aeropuertos)")));
          this.suggestedDestinations = [];
          this.destinationInput.enable();
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
  openDateSelection(){
    const round = this.round;
    const dates = this.dates;
    this.bottomSheet.open(FlightDateSelectionSheetComponent, {data: {round, dates}}).afterDismissed().subscribe((data:{round: boolean, start: Date, end?:Date})=>{
      if(data!==undefined){
        if(data.round){
          this.round = data.round;
          this.dates = [data.start, (data.end as Date)];
          this.departure = this.dates[0];
          this.return = this.dates[1];
        }else{
          this.round = data.round;
          this.dates = [data.start];
          this.departure = this.dates[0];
          this.return = undefined;
        }
      }
    });
  }
  searchFlights(){
    console.log(this.selectedFlightClass.id);
      if(this.areTravelParamsDefined()){
        this.shared.setLoading(true);
        let searchEventData:any = {
          search_term: this.destination!.address.cityName, // Término de búsqueda principal
          location: this.destination, // Puede ser el mismo o más específico
          date: this.datepipe.transform(this.dates[0], "yyyy-MM-dd"),
          round: this.round,
          adults: this.passengers.adults,
          childrens: this.passengers.childrens,
          infants: this.passengers.infants
        }
        if(this.round){
          searchEventData.return_date = this.datepipe.transform(this.dates[1], "yyyy-MM-dd");
        }
        logEvent(this.gtag,'search', searchEventData);
        this.fbp.track('Search');
        const url:string = "/resultados/vuelos/"
        +(this.origin?.subType==="AIRPORT"?'A':'C')+this.origin?.iataCode+"/"
        +(this.destination?.subType==="AIRPORT"?'A':'C')+this.destination?.iataCode+"/"
        +this.datepipe.transform(this.dates[0], "yyyy-MM-dd")+"/"
        +(this.round?this.datepipe.transform(this.dates[1], "yyyy-MM-dd"):"NA")+"/"
        +this.passengers.adults.toString()+"/"
        +(this.passengers.childrens.toString())+"/"
        +this.passengers.infants.toString()+"/"
        +this.selectedFlightClass.id
        +"?reloadTime="+new Date().getTime();
        //console.log(url);
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigateByUrl(url);
        });
      }
      
    }
  areTravelParamsDefined(): boolean {
    if (this.origin !== undefined && this.destination !== undefined && this.dates !== undefined) {
      //console.log(`Todos los parámetros están definidos: origin = ${this.origin}, destination = ${this.destination}, dates = ${this.dates}`);
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

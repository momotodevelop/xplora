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
import { HotelLocationSelectorBottomsheetComponent } from '../../../shared/hotel-location-selector-bottomsheet/hotel-location-selector-bottomsheet.component';
import { HotelDateSelectionSheetComponent } from '../../../shared/hotel-date-selection-sheet/hotel-date-selection-sheet.component';
import { HotelRoomsSelectionSheetComponent } from '../../../shared/hotel-rooms-selection-sheet/hotel-rooms-selection-sheet.component';
export interface Passengers{
  adults:number;
  childrens:number;
  infants:number;
}
export interface HotelSearchLocationData{
  lat: number,
  lng: number,
  name: string,
  id: string
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
  hotelLocation?:HotelSearchLocationData;
  hotelRooms:number[][]=[
    [2,0]
  ];
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
  openHotelDestination(){
    this._bottomSheet.open(HotelLocationSelectorBottomsheetComponent, {panelClass:"locationSelectionSheet"}).afterDismissed().subscribe((result:google.maps.places.PlacePrediction)=>{
      this.getPlaceData(result, ["displayName", "location"]).then(suggestion=>{
        this.hotelLocation = {
          name: suggestion.place.displayName!,
          id: suggestion.place.id,
          lat: suggestion.place.location!.lat(),
          lng: suggestion.place.location!.lat()
        }
      })
    });
  }
  async getPlaceData(suggestion: google.maps.places.PlacePrediction,fields:string[]){
    return suggestion.toPlace().fetchFields({fields})
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
  openRoomSelector(){
    this._bottomSheet.open(HotelRoomsSelectionSheetComponent, {panelClass: 'bottomsheet-no-padding', data: this.hotelRooms}).afterDismissed().subscribe((result:number[][])=>{
      if(result!==undefined){
        this.hotelRooms = result;
      }
    });
  }
  getRoomsCount(passengerArray: number[][]): {total: number;adults: number;minors: number;rooms:number;} {
    let adults = 0;
    let minors = 0;
  
    passengerArray.forEach(([adultCount, minorCount]) => {
      adults += adultCount;
      minors += minorCount;
    });
  
    return {
      total: adults + minors,
      adults,
      minors,
      rooms: passengerArray.length
    };
  }
  getRoomsText(abreviated:boolean=false, resumed:boolean=false){
    const roomCount = this.getRoomsCount(this.hotelRooms);
    let text =  roomCount.rooms+" "+(roomCount.rooms>1?(abreviated?'Habs.':'Habitaciones'):(abreviated?'Hab.':'Habitación'))+" - "+
                roomCount.adults+" "+(roomCount.adults>1?(abreviated?'Adts':'Adultos'):(abreviated?'Adt':'Adulto'))+" - "+
                (abreviated?roomCount.minors:(roomCount.minors>0?roomCount.minors:"Sin"))+" "+(roomCount.minors===1?(abreviated?"Mnr":"Menor"):(abreviated?"Mnrs":"Menores"));
    if(resumed){
        text =  roomCount.rooms+" "+(roomCount.rooms>1?(abreviated?'Habs.':'Habitaciones'):(abreviated?'Hab.':'Habitación'))+" - "+
                roomCount.total+" "+(roomCount.total>1?'Huespedes':'Huesped');
    }
    return text;
  }
  openHotelDateSelection(dates: Date[]){
    this._bottomSheet.open(HotelDateSelectionSheetComponent, {data: {dates}}).afterDismissed().subscribe((data:{start:Date, end: Date})=>{
      if(data!==undefined){
        this.dates = [data.start, data.end];
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
  searchHotels(){
    if(this.areHotelParamsDefined()){
      const roomString:string = this.hotelRooms.map(pair => pair.join(',')).join('_');
      const url:string = "resultados/hoteles/"+
      this.hotelLocation?.id+"/"+
      roomString+"/"+
      this.datepipe.transform(this.dates[0], "YYYY-MM-dd")+"/"+
      this.datepipe.transform(this.dates[1], "YYYY-MM-dd");
      console.log(url);
      this.router.navigateByUrl(url);
    }
  }
  searchFlights(){
    if(this.areTravelParamsDefined()){
      const url:string = "resultados/vuelos/"
      +(this.origin?.subType==="AIRPORT"?'A':'C')+this.origin?.iataCode+"/"
      +(this.destination?.subType==="AIRPORT"?'A':'C')+this.destination?.iataCode+"/"
      +this.datepipe.transform(this.dates[0], "YYYY-MM-dd")+"/"
      +(this.round?this.datepipe.transform(this.dates[1], "YYYY-MM-dd"):"NA")+"/"
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
  areHotelParamsDefined(): boolean {
    if (this.hotelLocation !== undefined && this.dates !== undefined && this.hotelRooms !== undefined) {
      console.log(`Todos los parámetros están definidos: destination = ${this.hotelLocation.name}, dates = ${this.dates}`);
      return true;
    } else {
      if (this.dates === undefined) {
        console.warn('dates es undefined.');
        this.snackBar.open("Elige una fecha para tu hotel", undefined, {duration: 1500});
      }
      if (this.hotelLocation === undefined) {
        console.warn('destination es undefined.');
        this.snackBar.open("Elige un destino para tu hotel", undefined, {duration: 1500});
      }
      if (this.hotelRooms === undefined) {
        console.warn('origin es undefined.');
        this.snackBar.open("Elige habitaciones para tu hotel", undefined, {duration: 1500});
      }
      return false;
    }
  }
}

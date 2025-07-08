import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { HotelRoomsSelectionSheetComponent } from '../../../../shared/hotel-rooms-selection-sheet/hotel-rooms-selection-sheet.component';
import { HotelLocationSelectorBottomsheetComponent } from '../../../../shared/hotel-location-selector-bottomsheet/hotel-location-selector-bottomsheet.component';
import { HotelSearchLocationData } from '../../../home/search/search.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HotelDateSelectionSheetComponent } from '../../../../shared/hotel-date-selection-sheet/hotel-date-selection-sheet.component';
import { MatDialogClose } from '@angular/material/dialog';

@Component({
  selector: 'app-hotel-sidebar-search-details',
  imports: [CommonModule, MatBottomSheetModule, DatePipe, MatDialogClose],
  templateUrl: './hotel-sidebar-search-details.component.html',
  styleUrl: './hotel-sidebar-search-details.component.scss',
  providers: [DatePipe]
})
export class HotelSidebarSearchDetailsComponent implements OnInit {
  @Input() checkIn!:Date;
  @Input() checkOut!:Date;
  @Input() destination!:google.maps.places.Place;
  @Input() rooms!:number[][];
  @Input() isBottomsheet:boolean = false;
  @Output() onSearch: EventEmitter<void> = new EventEmitter();
  constructor(private _bottomSheet : MatBottomSheet, private snackBar: MatSnackBar, private datepipe: DatePipe, private router: Router){
    
  }
  ngOnInit(): void {
    //console.log(this.checkIn);
  }
  openRoomSelector(){
    this._bottomSheet.open(HotelRoomsSelectionSheetComponent, {panelClass: 'bottomsheet-no-padding', data: this.rooms}).afterDismissed().subscribe((result:number[][])=>{
      if(result!==undefined){
        this.rooms = result;
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
  openHotelDateSelection(){
    this._bottomSheet.open(HotelDateSelectionSheetComponent, {data: {dates: [this.checkIn, this.checkOut]}}).afterDismissed().subscribe((data:{start:Date, end: Date})=>{
      if(data!==undefined){
        this.checkIn = data.start;
        this.checkOut = data.end;
      }
    });
  }
  getRoomsText(abreviated:boolean=false, resumed:boolean=false){
    const roomCount = this.getRoomsCount(this.rooms);
    let text =  roomCount.rooms+" "+(roomCount.rooms>1?(abreviated?'Habs.':'Habitaciones'):(abreviated?'Hab.':'Habitación'))+" - "+
                roomCount.adults+" "+(roomCount.adults>1?(abreviated?'Adts':'Adultos'):(abreviated?'Adt':'Adulto'))+" - "+
                (abreviated?roomCount.minors:(roomCount.minors>0?roomCount.minors:"Sin"))+" "+(roomCount.minors===1?(abreviated?"Mnr":"Menor"):(abreviated?"Mnrs":"Menores"));
    if(resumed){
        text =  roomCount.rooms+" "+(roomCount.rooms>1?(abreviated?'Habs.':'Habitaciones'):(abreviated?'Hab.':'Habitación'))+" - "+
                roomCount.total+" "+(roomCount.total>1?'Huespedes':'Huesped');
    }
    return text;
  }
  openHotelDestination(){
    this._bottomSheet.open(HotelLocationSelectorBottomsheetComponent, {panelClass:"locationSelectionSheet"}).afterDismissed().subscribe((result:google.maps.places.PlacePrediction)=>{
      this.getPlaceData(result, ["displayName", "location"]).then(suggestion=>{
        this.destination = suggestion.place;
      });
    });
  }
  async getPlaceData(suggestion: google.maps.places.PlacePrediction,fields:string[]){
    return suggestion.toPlace().fetchFields({fields})
  }
  searchHotels(){
    if(this.areHotelParamsDefined()){
      const roomString:string = this.rooms.map(pair => pair.join(',')).join('_');
      const url:string = "resultados/hoteles/"+
      this.destination?.id+"/"+
      roomString+"/"+
      this.datepipe.transform(this.checkIn, "YYYY-MM-dd")+"/"+
      this.datepipe.transform(this.checkOut, "YYYY-MM-dd");
      this.router.navigateByUrl(url);
      this.onSearch.emit();
    }
  }
  areHotelParamsDefined(): boolean {
    if (this.destination !== undefined && this.checkIn !== undefined && this.checkOut !== undefined && this.rooms !== undefined) {
      return true;
    } else {
      if (this.checkOut === undefined || this.checkIn === undefined) {
        console.warn('dates es undefined.');
        this.snackBar.open("Elige una fecha para tu hotel", undefined, {duration: 1500});
      }
      if (this.destination === undefined) {
        console.warn('destination es undefined.');
        this.snackBar.open("Elige un destino para tu hotel", undefined, {duration: 1500});
      }
      if (this.rooms === undefined) {
        console.warn('origin es undefined.');
        this.snackBar.open("Elige habitaciones para tu hotel", undefined, {duration: 1500});
      }
      return false;
    }
  }
}

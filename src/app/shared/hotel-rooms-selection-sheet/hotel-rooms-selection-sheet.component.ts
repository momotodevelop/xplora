import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { BottomSheetHeaderComponent } from '../bottom-sheet-header/bottom-sheet-header.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { faAdd } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-hotel-rooms-selection-sheet',
  imports: [
    BottomSheetHeaderComponent, 
    MatExpansionModule, 
    MatIconModule, 
    MatFormFieldModule, 
    MatOptionModule, 
    MatSelectModule, 
    MatButtonModule,
    FontAwesomeModule
  ],
  templateUrl: './hotel-rooms-selection-sheet.component.html',
  styleUrl: './hotel-rooms-selection-sheet.component.scss'
})
export class HotelRoomsSelectionSheetComponent {
  adultOptions:number[]=[1,2,3,4];
  childrenOptions:number[]=[0,1,2,3,4];
  rooms:number[][];
  addIcon=faAdd;
  constructor(private _ref: MatBottomSheetRef<HotelRoomsSelectionSheetComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: number[][]){
    this.rooms=data;
  }
  addRoom(){
    this.rooms.push([2,0]);
  }
  removeRoom(index:number){
    const rooms = this.rooms.splice(index, 1);
    console.log(rooms);
  }
  close(){
    this._ref.dismiss();
  }
  guestPerRoom(guests:number[]):number{
    return guests[0]+guests[1];
  }
  save(){
    this._ref.dismiss(this.rooms);
  }
}

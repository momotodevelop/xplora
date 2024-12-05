import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { ExtraBaggageData } from '../add-carry-on/add-carry-on.component';
import { ExtraServiceBottomSheetData } from '../extras.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
    selector: 'app-add-baggage',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, MatIconModule],
    templateUrl: './add-baggage.component.html',
    styleUrl: './add-baggage.component.scss'
})
export class AddBaggageComponent {
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  extraBaggage:ExtraBaggageData[][];
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddBaggageComponent>){
    this.price = this.data.price;
    this.extraBaggage = this.data.flights.map(flight=>{
      let selectionArray:{passengerID: number, pieces: number}[] = []
      this.data.passengers.forEach((passenger,i)=>{
        selectionArray.push({passengerID: i, pieces: 0});
      })
      return selectionArray
    });
  }
  ngAfterViewInit(): void {
    if(this.data.saved){
      this.extraBaggage = this.data.saved;
      this.change();
    }
  }
  addPiece(flightI:number, passengerI:number){
    this.extraBaggage[flightI][passengerI].pieces = this.extraBaggage[flightI][passengerI].pieces+1;
    this.change();
  }
  removePiece(flightI:number, passengerI:number){
    this.extraBaggage[flightI][passengerI].pieces = this.extraBaggage[flightI][passengerI].pieces-1;
    this.change();
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  save(){
    this._bottomSheetRef.dismiss(this.extraBaggage);
  }
  change(){
    let total:number = 0;
    this.extraBaggage.forEach(extraBaggageFlight=>{
      extraBaggageFlight.forEach(extraItem=>{
        total+=extraItem.pieces*this.price;
      });
    })
    this.total=total
  }
}

import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, ViewChild, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule, MatSelectionList, MatListOption } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";
import { AddPremiumInsuranceComponent } from "../add-insurance/add-insurance.component";
export interface ExtraBaggageData{passengerID: number, pieces: number}

@Component({
    selector: 'app-extras-pets',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, MatIconModule],
    templateUrl: './add-carry-on.component.html'
})
export class AddCarryOnComponent implements AfterViewInit{
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  extraBaggage:ExtraBaggageData[][];
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>){
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
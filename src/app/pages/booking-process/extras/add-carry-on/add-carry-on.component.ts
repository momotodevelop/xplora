import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, ViewChild, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule, MatSelectionList, MatListOption } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";
import { AddPremiumInsuranceComponent } from "../add-insurance/add-insurance.component";
import { FlightAdditionalServiceItem } from "../../../../types/booking.types";
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
  extraBaggage:{outbound: FlightAdditionalServiceItem[], inbound: FlightAdditionalServiceItem[]};
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>){
    this.price = this.data.price;
    this.extraBaggage = this.data.saved;
  }
  ngAfterViewInit(): void {
    if(this.data.saved){
      this.extraBaggage = this.data.saved;
      this.change();
    }
  }
  addPiece(scope:'INBOUND'|'OUTBOUND', passengerI:number){
    let item:FlightAdditionalServiceItem;
    if(scope==='OUTBOUND'){
      item = this.extraBaggage.outbound[passengerI];
    }else{
      item = this.extraBaggage.inbound[passengerI];
    }
    item.value = (item.value?item.value:0)+1;
    this.change();
  }
  removePiece(scope:'INBOUND'|'OUTBOUND', passengerI:number){
    let item:FlightAdditionalServiceItem;
    if(scope==='OUTBOUND'){
      item = this.extraBaggage.outbound[passengerI];
    }else{
      item = this.extraBaggage.inbound[passengerI];
    }
    item.value = (item.value?item.value:0)-1;
    this.change();
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  save(){
    this._bottomSheetRef.dismiss(this.extraBaggage);
  }
  change(){
    const outboundPieces = this.extraBaggage.outbound.reduce((total, item)=>{
      return total+(item.value?item.value:0);
    },0)
    const inboundPieces = this.extraBaggage.inbound.reduce((total, item)=>{
      return total+(item.value?item.value:0);
    },0)
    this.total=this.data.price*(outboundPieces+inboundPieces);
  }
}
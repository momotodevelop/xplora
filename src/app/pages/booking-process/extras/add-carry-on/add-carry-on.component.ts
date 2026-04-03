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
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { IconDefinition } from "@fortawesome/free-brands-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
export interface ExtraBaggageData{passengerID: number, pieces: number}

@Component({
    selector: 'app-extras-pets',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, MatIconModule, FontAwesomeModule],
    templateUrl: './add-carry-on.component.html'
})
export class AddCarryOnComponent implements AfterViewInit{
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  extraBaggage:{outbound: FlightAdditionalServiceItem[], inbound: FlightAdditionalServiceItem[]};
  includedIcon:IconDefinition = faCheckCircle;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>){
    this.price = this.data.price;
    this.extraBaggage = this.data.saved;
    this.ensureMinimumFree();
  }
  get outboundPrice(): number {
    return this.price * (this.data.outboundDurationFactor || 1);
  }
  get inboundPrice(): number {
    return this.price * (this.data.inboundDurationFactor || 0);
  }
  ngAfterViewInit(): void {
    if(this.data.saved){
      this.extraBaggage = this.data.saved;
      this.ensureMinimumFree();
      this.change();
    }
  }
  private ensureMinimumFree(){
    this.extraBaggage.outbound.forEach(item => {
      if ((item.value ?? 0) < 1) {
        item.value = 1;
        item.active = true;
      }
    });
    this.extraBaggage.inbound.forEach(item => {
      if ((item.value ?? 0) < 1) {
        item.value = 1;
        item.active = true;
      }
    });
  }
  addPiece(scope:'INBOUND'|'OUTBOUND', passengerI:number){
    let item:FlightAdditionalServiceItem;
    if(scope==='OUTBOUND'){
      item = this.extraBaggage.outbound[passengerI];
    }else{
      item = this.extraBaggage.inbound[passengerI];
    }
    item.value = (item.value ?? 0)+1;
    item.active = item.value > 0;
    this.change();
  }
  removePiece(scope:'INBOUND'|'OUTBOUND', passengerI:number){
    let item:FlightAdditionalServiceItem;
    if(scope==='OUTBOUND'){
      item = this.extraBaggage.outbound[passengerI];
    }else{
      item = this.extraBaggage.inbound[passengerI];
    }
    const nextValue = (item.value ?? 0) - 1;
    item.value = Math.max(1, nextValue);
    item.active = item.value > 0;
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
      return total+Math.max(0, (item.value ?? 0) - 1);
    },0)
    const inboundPieces = this.extraBaggage.inbound.reduce((total, item)=>{
      return total+Math.max(0, (item.value ?? 0) - 1);
    },0)
    this.total=(this.outboundPrice*outboundPieces)+(this.inboundPrice*inboundPieces);
  }
}

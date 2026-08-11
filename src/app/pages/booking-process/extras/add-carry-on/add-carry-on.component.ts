import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";
import { FlightAdditionalServiceItem } from "../../../../types/booking.types";
import { XploraBottomSheetComponent } from '../../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

export interface ExtraBaggageData { passengerID: number; pieces: number }

@Component({
    selector: 'app-extras-pets',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatIconModule, XploraBottomSheetComponent],
    templateUrl: './add-carry-on.component.html',
    styleUrl: './add-carry-on.component.scss'
})
export class AddCarryOnComponent implements AfterViewInit{
  price:number;
  total:number=0;
  extraBaggage:{outbound: FlightAdditionalServiceItem[], inbound: FlightAdditionalServiceItem[]};
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddCarryOnComponent>){
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
      const minimum = this.includedQuantity(item);
      if ((item.value ?? 0) < minimum) {
        item.value = minimum;
        item.active = minimum > 0;
      }
    });
    this.extraBaggage.inbound.forEach(item => {
      const minimum = this.includedQuantity(item);
      if ((item.value ?? 0) < minimum) {
        item.value = minimum;
        item.active = minimum > 0;
      }
    });
  }
  includedQuantity(item:FlightAdditionalServiceItem):number {
    return Number(item.metadata?.['includedQuantity'] ?? 0);
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
    item.value = Math.max(this.includedQuantity(item), nextValue);
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
      return total+Math.max(0, (item.value ?? 0) - this.includedQuantity(item));
    },0)
    const inboundPieces = this.extraBaggage.inbound.reduce((total, item)=>{
      return total+Math.max(0, (item.value ?? 0) - this.includedQuantity(item));
    },0)
    this.total=(this.outboundPrice*outboundPieces)+(this.inboundPrice*inboundPieces);
  }
}

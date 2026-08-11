import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { ExtraServiceBottomSheetData } from '../extras.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FlightAdditionalServiceItem } from '../../../../types/booking.types';
import { XploraBottomSheetComponent } from '../../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-add-baggage',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatIconModule, XploraBottomSheetComponent],
    templateUrl: './add-baggage.component.html',
    styleUrl: './add-baggage.component.scss'
})
export class AddBaggageComponent implements OnInit {
  price:number;
  total:number=0;
  extraBaggage:{outbound: FlightAdditionalServiceItem[], inbound: FlightAdditionalServiceItem[]};
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddBaggageComponent>){
    this.price = this.data.price;
    this.extraBaggage = this.data.saved;
  }
  get outboundPrice(): number {
    return this.price * (this.data.outboundDurationFactor || 1);
  }
  get inboundPrice(): number {
    return this.price * (this.data.inboundDurationFactor || 0);
  }
  itemPrice(item: FlightAdditionalServiceItem, fallbackPrice: number): number {
    return item.unitPrice || fallbackPrice;
  }
  itemCurrency(item: FlightAdditionalServiceItem): string {
    return String(item.metadata?.['currency'] || 'MXN');
  }
  maxQuantity(item: FlightAdditionalServiceItem): number {
    return Number(item.metadata?.['maximumQuantity'] || 5);
  }
  ngOnInit(): void {
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
    const actualValue = (item.value ?? 0)+1;
    item.value = Math.min(this.maxQuantity(item), actualValue);
    item.active = actualValue>0;
    this.change();
  }
  removePiece(scope:'INBOUND'|'OUTBOUND', passengerI:number){
    let item:FlightAdditionalServiceItem;
    if(scope==='OUTBOUND'){
      item = this.extraBaggage.outbound[passengerI];
    }else{
      item = this.extraBaggage.inbound[passengerI];
    }
    const actualValue = (item.value ?? 0)-1;
    item.value = Math.max(0, actualValue);
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
    const outboundTotal = this.extraBaggage.outbound.reduce((total, item)=>{
      return total+((item.value?item.value:0) * this.itemPrice(item, this.outboundPrice));
    },0)
    const inboundTotal = this.extraBaggage.inbound.reduce((total, item)=>{
      return total+((item.value?item.value:0) * this.itemPrice(item, this.inboundPrice));
    },0)
    this.total=outboundTotal+inboundTotal;
  }
}

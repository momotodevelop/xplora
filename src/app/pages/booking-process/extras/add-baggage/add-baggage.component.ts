import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { ExtraBaggageData } from '../add-carry-on/add-carry-on.component';
import { ExtraServiceBottomSheetData } from '../extras.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FlightAdditionalServiceItem } from '../../../../types/booking.types';

@Component({
    selector: 'app-add-baggage',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, MatIconModule],
    templateUrl: './add-baggage.component.html',
    styleUrl: './add-baggage.component.scss'
})
export class AddBaggageComponent implements OnInit {
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  extraBaggage:{outbound: FlightAdditionalServiceItem[], inbound: FlightAdditionalServiceItem[]};
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddBaggageComponent>){
    this.price = this.data.price;
    this.extraBaggage = this.data.saved;
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
    item.value = actualValue;
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
    item.value = actualValue;
    item.active = actualValue>0;
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

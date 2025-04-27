import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionList, MatListOption } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { ExtraServiceBottomSheetData } from '../extras.component';
import { AddPremiumInsuranceComponent } from '../add-insurance/add-insurance.component';
import { FlightAdditionalServiceItem } from '../../../../types/booking.types';

@Component({
    selector: 'app-extras-flexpass',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule],
    templateUrl: './add-flex-pass.component.html'
})
export class AddFlexPassComponent implements AfterViewInit{
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>){
    this.price = this.data.price;
  }
  ngAfterViewInit(): void {
    if(this.data.saved){
      const saved = this.data.saved;
      if(saved.outbound.length>0){
        const selectedOptions:MatListOption[] = saved.outbound.map((selected,i)=>{
          return this.outbound.options.find(option=>option.value===i)
        }).filter(option => option!==undefined) as MatListOption[];
        this.outbound.selectedOptions.select(...selectedOptions);
      }
      if(saved.inbound!==undefined&&this.inbound){
        if(saved.inbound.length>0){
          const selectedOptions:MatListOption[] = saved.inbound.map((selected,i)=>{
            return this.inbound!.options.find(option=>option.value===i)
          }).filter(option => option!==undefined) as MatListOption[];
          this.inbound.selectedOptions.select(...selectedOptions);
        }
      }
      this.change();
    }
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  save() {
      const selectedOutbound: FlightAdditionalServiceItem[] = this.data.saved.outbound.map((item,i)=>{
        return {
          ...item,
          active: this.outbound.selectedOptions.selected[i]?.selected ?? false
        }
      });
  
      const selectedInbound: FlightAdditionalServiceItem[] = this.data.saved.inbound.map((item,i)=>{
        return {
          ...item,
          active: this.inbound?.selectedOptions.selected[i]?.selected ?? false
        }
      })
  
      const selectByFlight: { outbound: FlightAdditionalServiceItem[], inbound?: FlightAdditionalServiceItem[] } = {
        outbound: selectedOutbound,
        inbound: selectedInbound
      };
      this._bottomSheetRef.dismiss(selectByFlight);
    }
  change(){
    const selectedOutbound:MatListOption[] = this.outbound.selectedOptions.selected;
    const selectedInbound:MatListOption[] = this.inbound?.selectedOptions.selected ?? [];
    let total = this.price*selectedOutbound.length;
    if(selectedInbound){
      total += this.price*selectedInbound.length;
    }
    this.total=total
  }
}

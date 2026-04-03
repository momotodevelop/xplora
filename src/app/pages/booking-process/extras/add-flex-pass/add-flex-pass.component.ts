import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule, MatSelectionList, MatListOption } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { ExtraServiceBottomSheetData } from '../extras.component';
import { AddPremiumInsuranceComponent } from '../add-insurance/add-insurance.component';
import { FlightAdditionalServiceItem } from '../../../../types/booking.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-extras-flexpass',
    imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, FontAwesomeModule],
    templateUrl: './add-flex-pass.component.html',
    styleUrl: './add-flex-pass.component.scss'
})
export class AddFlexPassComponent implements AfterViewInit{
  price:number;
  total:number=0;
  @ViewChild('outbound') outbound!:MatSelectionList;
  @ViewChild('inbound') inbound?:MatSelectionList;
  includedIcon = faCheckCircle;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
  private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>){
    this.price = this.data.price;
  }
  get outboundPrice(): number {
    return this.price * (this.data.outboundSegmentCount || 1);
  }
  get inboundPrice(): number {
    return this.price * (this.data.inboundSegmentCount || 0);
  }
  ngAfterViewInit(): void {
    if(this.data.saved){
      const saved = this.data.saved;
      if(saved.outbound.length>0){
        const selectedOptions:MatListOption[] = saved.outbound.map((selected,i)=>{
          return (selected.active || selected.value > 0) ? this.outbound.options.find(option=>option.value===i) : undefined;
        }).filter(option => option!==undefined) as MatListOption[];
        this.outbound.selectedOptions.select(...selectedOptions);
      }
      if(saved.inbound!==undefined&&this.inbound){
        if(saved.inbound.length>0){
          const selectedOptions:MatListOption[] = saved.inbound.map((selected,i)=>{
            return (selected.active || selected.value > 0) ? this.inbound!.options.find(option=>option.value===i) : undefined;
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
      const outboundSelected = new Set(this.outbound.selectedOptions.selected.map(option => option.value));
      const inboundSelected = new Set(this.inbound?.selectedOptions.selected.map(option => option.value) ?? []);

      const selectedOutbound: FlightAdditionalServiceItem[] = this.data.saved.outbound.map((item,i)=>{
        const isSelected = outboundSelected.has(i);
        return {
          ...item,
          active: isSelected,
          value: isSelected ? 1 : 0
        }
      });
  
      const selectedInbound: FlightAdditionalServiceItem[] = this.data.saved.inbound.map((item,i)=>{
        const isSelected = inboundSelected.has(i);
        return {
          ...item,
          active: isSelected,
          value: isSelected ? 1 : 0
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
    let total = this.outboundPrice * selectedOutbound.length;
    if(selectedInbound){
      total += this.inboundPrice * selectedInbound.length;
    }
    this.total=total
  }
}

import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, ViewChild, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule, MatSelectionList, MatListOption } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";

@Component({
  selector: 'app-extras-insurance',
  standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule],
  templateUrl: './add-insurance.component.html'
})
export class AddPremiumInsuranceComponent implements AfterViewInit{
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
      const saved = this.data.saved as number[][];
      if(saved[0].length>0){
        const selectedOptions:MatListOption[] = saved[0].map(selected=>{
          return this.outbound.options.find(option=>option.value===selected)
        }).filter(option => option!==undefined) as MatListOption[];
        this.outbound.selectedOptions.select(...selectedOptions);
      }
      if(saved[1]!==undefined&&this.inbound){
        if(saved[1].length>0){
          const selectedOptions:MatListOption[] = saved[1].map(selected=>{
            return this.inbound!.options.find(option=>option.value===selected)
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
  save(){
    const selectedOutbound:number[] = this.outbound.selectedOptions.selected.map(selected=>{
      return selected.value as number;
    });
    const selectedInbound:number[]|undefined = this.inbound?.selectedOptions.selected.map(selected=>{
      return selected.value as number;
    });
    const selectByFlight:number[][] = [selectedOutbound];
    if(selectedInbound){
      selectByFlight.push(selectedInbound);
    }
    this._bottomSheetRef.dismiss(selectByFlight);
  }
  change(){
    const selectedOutbound:number[] = this.outbound.selectedOptions.selected.map(selected=>{
      return selected.value as number;
    });
    const selectedInbound:number[]|undefined = this.inbound?.selectedOptions.selected.map(selected=>{
      return selected.value as number;
    });
    let total = this.price*selectedOutbound.length;
    console.log(selectedOutbound);
    if(selectedInbound){
      total += this.price*selectedInbound.length;
    }
    this.total=total
  }
}
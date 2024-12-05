import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-pax-selection-sheet',
    imports: [MatBottomSheetModule, MatButtonModule, ScrollingModule],
    templateUrl: './pax-selection-sheet.component.html',
    styleUrl: './pax-selection-sheet.component.scss'
})
export class PaxSelectionSheetComponent implements OnInit {
  adults:number=1;
  childrens:number=0;
  infants:number=0;
  constructor(private _bottomSheetRef: MatBottomSheetRef<PaxSelectionSheetComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: number[]){}
  ngOnInit(): void {
    this.adults=this.data[0];
    this.childrens=this.data[1],
    this.infants=this.data[2]
  }
  addPax(type:"ADULTS"|"CHILDRENS"|"INFANTS"){
    switch (type) {
      case "ADULTS":
        this.adults=this.adults+1;
        break;
      case "CHILDRENS":
        this.childrens=this.childrens+1;
        break;
      case "INFANTS":
        this.infants=this.infants+1;
        break;
      default:
        this.adults=this.adults+1;
        break;
    }
    console.log(this.adults);
  }
  minusPax(type:"ADULTS"|"CHILDRENS"|"INFANTS"){
    switch (type) {
      case "ADULTS":
        this.adults=this.adults-1;
        break;
      case "CHILDRENS":
        this.childrens=this.childrens-1;
        break;
      case "INFANTS":
        this.infants=this.infants-1;
        break;
      default:
        this.adults=this.adults-1;
        break;
    }
  }
  close(){
    this._bottomSheetRef.dismiss([this.adults, this.childrens, this.infants]);
  }
}

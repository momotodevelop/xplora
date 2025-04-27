import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, ViewChild, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule, MatSelectionList, MatListOption } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";
import { FlightAdditionalServiceItem } from "../../../../types/booking.types";

@Component({
  selector: 'app-extras-insurance',
  standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule],
  templateUrl: './add-insurance.component.html'
})
export class AddPremiumInsuranceComponent implements AfterViewInit {
  price: number;
  total: number = 0;

  @ViewChild('outbound') outbound!: MatSelectionList;
  @ViewChild('inbound') inbound?: MatSelectionList;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
    private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>
  ) {
    this.price = this.data.price;
  }

  ngAfterViewInit(): void {
    if (this.data.saved) {
      const saved = this.data.saved;

      // Outbound
      if (saved.outbound?.length > 0) {
        const selectedOptions: MatListOption[] = saved.outbound
          .map(item => this.outbound.options.find((option,i) => option.value === i))
          .filter(option => option !== undefined) as MatListOption[];
        this.outbound.selectedOptions.select(...selectedOptions);
      }

      // Inbound
      if (saved.inbound?.length > 0 && this.inbound) {
        const selectedOptions: MatListOption[] = saved.inbound
          .map(item => this.inbound!.options.find((option,i) => option.value === i))
          .filter(option => option !== undefined) as MatListOption[];
        this.inbound.selectedOptions.select(...selectedOptions);
      }

      this.change();
    }
  }

  close() {
    this._bottomSheetRef.dismiss();
  }

  save() {
    const selectedOutbound: FlightAdditionalServiceItem[] = this.data.saved.outbound.map((item,i)=>{
      return {
        ...item,
        active: this.outbound.selectedOptions.selected[i]?.selected ?? false,
        value: this.outbound.selectedOptions.selected[i]?.selected ? 1 : 0
      }
    });

    const selectedInbound: FlightAdditionalServiceItem[] = this.data.saved.inbound.map((item,i)=>{
      return {
        ...item,
        active: this.inbound?.selectedOptions.selected[i]?.selected ?? false,
        value: this.inbound?.selectedOptions.selected[i]?.selected ? 1 : 0
      }
    })

    const selectByFlight: { outbound: FlightAdditionalServiceItem[], inbound?: FlightAdditionalServiceItem[] } = {
      outbound: selectedOutbound,
      inbound: selectedInbound
    };
    this._bottomSheetRef.dismiss(selectByFlight);
  }

  change() {
    const outboundCount = this.outbound.selectedOptions.selected.length;
    const inboundCount = this.inbound?.selectedOptions.selected.length || 0;
    this.total = this.price * (outboundCount + inboundCount);
  }
}
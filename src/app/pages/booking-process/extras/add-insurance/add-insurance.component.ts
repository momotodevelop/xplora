import { CommonModule } from "@angular/common";
import { Component, AfterViewInit, ViewChild, Inject } from "@angular/core";
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule, MatSelectionList, MatListOption } from "@angular/material/list";
import { MatTabsModule } from "@angular/material/tabs";
import { ExtraServiceBottomSheetData } from "../extras.component";
import { FlightAdditionalServiceItem } from "../../../../types/booking.types";
import { MatIconModule } from "@angular/material/icon";
import { XploraBottomSheetComponent } from '../../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
  selector: 'app-extras-insurance',
  standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, CommonModule, MatTabsModule, MatListModule, MatIconModule, XploraBottomSheetComponent],
  templateUrl: './add-insurance.component.html',
  styleUrl: './add-insurance.component.scss'
})
export class AddPremiumInsuranceComponent implements AfterViewInit {
  price: number;
  total: number = 0;
  showAllBenefits: boolean = false;

  @ViewChild('outbound') outbound!: MatSelectionList;
  @ViewChild('inbound') inbound?: MatSelectionList;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: ExtraServiceBottomSheetData,
    private _bottomSheetRef: MatBottomSheetRef<AddPremiumInsuranceComponent>
  ) {
    this.price = this.data.price;
  }
  get outboundPrice(): number {
    return this.price * (this.data.outboundSegmentCount || 1);
  }
  get inboundPrice(): number {
    return this.price * (this.data.inboundSegmentCount || 0);
  }
  get selectedPassengerCount(): number {
    return (this.outbound?.selectedOptions.selected.length || 0) +
      (this.inbound?.selectedOptions.selected.length || 0);
  }
  get totalPassengerOptions(): number {
    return (this.outbound?.options.length || 0) + (this.inbound?.options.length || 0);
  }
  get allPassengersSelected(): boolean {
    return this.totalPassengerOptions > 0 && this.selectedPassengerCount === this.totalPassengerOptions;
  }

  ngAfterViewInit(): void {
    if (this.data.saved) {
      const saved = this.data.saved;

      // Outbound
      if (saved.outbound?.length > 0) {
        const selectedOptions: MatListOption[] = saved.outbound
          .map((item, i) => item.active || item.value > 0 ? this.outbound.options.find(option => option.value === i) : undefined)
          .filter(option => option !== undefined) as MatListOption[];
        this.outbound.selectedOptions.select(...selectedOptions);
      }

      // Inbound
      if (saved.inbound?.length > 0 && this.inbound) {
        const selectedOptions: MatListOption[] = saved.inbound
          .map((item, i) => item.active || item.value > 0 ? this.inbound!.options.find(option => option.value === i) : undefined)
          .filter(option => option !== undefined) as MatListOption[];
        this.inbound.selectedOptions.select(...selectedOptions);
      }

      this.change();
    }
  }

  close() {
    this._bottomSheetRef.dismiss();
  }

  toggleAllPassengers(): void {
    const shouldSelect = !this.allPassengersSelected;
    [this.outbound, this.inbound].forEach(list => {
      if (!list) return;
      if (shouldSelect) {
        list.selectAll();
      } else {
        list.deselectAll();
      }
    });
    this.change();
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

  change() {
    const outboundCount = this.outbound.selectedOptions.selected.length;
    const inboundCount = this.inbound?.selectedOptions.selected.length || 0;
    const outboundTotal = this.outboundPrice * outboundCount;
    const inboundTotal = this.inboundPrice * inboundCount;
    this.total = outboundTotal + inboundTotal;
  }

  toggleBenefits() {
    this.showAllBenefits = !this.showAllBenefits;
  }
}

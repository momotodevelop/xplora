import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { DateRange, MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { PreventEditDirective } from '../../prevent-edit.directive';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-hotel-date-selection-sheet',
  imports: [MatDatepickerModule, MatInputModule, CommonModule, PreventEditDirective],
  templateUrl: './hotel-date-selection-sheet.component.html',
  styleUrl: './hotel-date-selection-sheet.component.scss',
  providers: [provideNativeDateAdapter(), DatePipe]
})
export class HotelDateSelectionSheetComponent implements OnInit {
  selectedDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  isActiveStart: boolean = false;
  isActiveEnd: boolean = false;
  @ViewChild('start') startElement!: ElementRef;
  @ViewChild('end') endElement!: ElementRef;

  constructor(
    private _bottomSheetRef: MatBottomSheetRef<HotelDateSelectionSheetComponent>, 
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { dates: Date[] }
  ){}

  ngOnInit(): void {
    console.log(this.data);
    if(this.data.dates!==undefined){
      this.selectedDateRange = new DateRange(this.data.dates[0], this.data.dates[1]);
    }
  }
  
  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Solo para la vista de mes
    if (view === 'month') {
      const dateFrom = this.selectedDateRange.start;
      const dateTo = this.selectedDateRange.end;

      if (dateFrom && dateTo) {
        if (dateFrom <= cellDate && cellDate <= dateTo) {
          return 'selected-date-range';
        }
      }
    }
    return '';
  };
  onRangeDateSelected(date: Date | null): void {
    if (!this.selectedDateRange.start || (this.selectedDateRange.start && this.selectedDateRange.end)) {
      this.isActiveStart = true;
      this.isActiveEnd = false;
      this.startElement.nativeElement.focus();
      this.selectedDateRange = new DateRange(date, null);
    } else if (this.selectedDateRange.start && !this.selectedDateRange.end) {
      this.isActiveStart = false;
      this.isActiveEnd = true;
      this.endElement.nativeElement.focus();
      if (date! < this.selectedDateRange.start) {
        this.selectedDateRange = new DateRange(date, this.selectedDateRange.start);
      } else {
        this.selectedDateRange = new DateRange(this.selectedDateRange.start, date);
        this._bottomSheetRef.dismiss({
          start: this.selectedDateRange.start,
          end: this.selectedDateRange.end
        });
      }
    }
  }
}


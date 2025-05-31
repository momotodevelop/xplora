import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { DateRange, MatCalendarCellClassFunction, MatDatepickerModule } from '@angular/material/datepicker';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { CommonModule, DatePipe } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { PreventEditDirective } from '../../prevent-edit.directive';

@Component({
    selector: 'app-flight-date-selection-sheet',
    imports: [MatDatepickerModule, MatTabsModule, MatInputModule, CommonModule, MatGridListModule, PreventEditDirective],
    templateUrl: './flight-date-selection-sheet.component.html',
    styleUrl: './flight-date-selection-sheet.component.scss',
    providers: [provideNativeDateAdapter(), DatePipe]
})
export class FlightDateSelectionSheetComponent implements OnInit {
  selectedDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  singleDate: Date | null = null;
  isActiveStart: boolean = false;
  isActiveEnd: boolean = false;
  minDate = new Date();
  round:boolean=true;
  @ViewChild('start') startElement!: ElementRef;
  @ViewChild('end') endElement!: ElementRef;
  constructor(
    private _bottomSheetRef: MatBottomSheetRef<FlightDateSelectionSheetComponent>, 
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { round: boolean, dates: Date[] }
  ){}

  ngOnInit(): void {
    this.round=this.data.round;
    if(this.data.dates!==undefined){
      if(this.round){
        this.selectedDateRange = new DateRange(this.data.dates[0], this.data.dates[1]);
      }else{
        this.singleDate=this.data.dates[0];
      }
    }
  }

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Solo para la vista de mes
    if (view === 'month') {
      const dateFrom = this.selectedDateRange.start;
      const dateTo = this.selectedDateRange.end;

      if (dateFrom && dateTo) {
        if (dateFrom <= cellDate && cellDate <= dateTo) {
          return 'example-custom-date-class';
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
          round: this.round,
          start: this.selectedDateRange.start,
          end: this.selectedDateRange.end
        });
      }
    }
  }

  onSingleDateSelected(event: Date): void {
    this.singleDate = event;
    this._bottomSheetRef.dismiss({
      round: this.round,
      start: this.singleDate
    });
  }

  tabChange(index:number){
    this.round=index<1;
    console.log(this.round)
  }

}

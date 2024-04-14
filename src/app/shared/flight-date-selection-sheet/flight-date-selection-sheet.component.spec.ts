import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightDateSelectionSheetComponent } from './flight-date-selection-sheet.component';

describe('FlightDateSelectionSheetComponent', () => {
  let component: FlightDateSelectionSheetComponent;
  let fixture: ComponentFixture<FlightDateSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightDateSelectionSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlightDateSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

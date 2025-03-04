import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDateSelectionSheetComponent } from './hotel-date-selection-sheet.component';

describe('HotelDateSelectionSheetComponent', () => {
  let component: HotelDateSelectionSheetComponent;
  let fixture: ComponentFixture<HotelDateSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDateSelectionSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDateSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

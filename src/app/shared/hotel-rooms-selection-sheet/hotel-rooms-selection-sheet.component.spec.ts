import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelRoomsSelectionSheetComponent } from './hotel-rooms-selection-sheet.component';

describe('HotelRoomsSelectionSheetComponent', () => {
  let component: HotelRoomsSelectionSheetComponent;
  let fixture: ComponentFixture<HotelRoomsSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelRoomsSelectionSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelRoomsSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

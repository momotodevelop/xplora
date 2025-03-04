import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingAddonsTransfersSheetComponent } from './hotel-booking-addons-transfers-sheet.component';

describe('HotelBookingAddonsTransfersSheetComponent', () => {
  let component: HotelBookingAddonsTransfersSheetComponent;
  let fixture: ComponentFixture<HotelBookingAddonsTransfersSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingAddonsTransfersSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingAddonsTransfersSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

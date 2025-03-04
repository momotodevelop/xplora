import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingAddonsTransfersComponent } from './hotel-booking-addons-transfers.component';

describe('HotelBookingAddonsTransfersComponent', () => {
  let component: HotelBookingAddonsTransfersComponent;
  let fixture: ComponentFixture<HotelBookingAddonsTransfersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingAddonsTransfersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingAddonsTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

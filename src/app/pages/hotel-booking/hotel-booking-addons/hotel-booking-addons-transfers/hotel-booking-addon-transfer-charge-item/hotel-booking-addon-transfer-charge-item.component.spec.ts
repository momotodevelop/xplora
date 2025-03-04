import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingAddonTransferChargeItemComponent } from './hotel-booking-addon-transfer-charge-item.component';

describe('HotelBookingAddonTransferChargeItemComponent', () => {
  let component: HotelBookingAddonTransferChargeItemComponent;
  let fixture: ComponentFixture<HotelBookingAddonTransferChargeItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingAddonTransferChargeItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingAddonTransferChargeItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

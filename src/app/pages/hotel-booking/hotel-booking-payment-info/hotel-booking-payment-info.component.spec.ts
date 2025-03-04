import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingPaymentInfoComponent } from './hotel-booking-payment-info.component';

describe('HotelBookingPaymentInfoComponent', () => {
  let component: HotelBookingPaymentInfoComponent;
  let fixture: ComponentFixture<HotelBookingPaymentInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingPaymentInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingPaymentInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

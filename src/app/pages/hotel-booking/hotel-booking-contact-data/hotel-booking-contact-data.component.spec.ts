import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingContactDataComponent } from './hotel-booking-contact-data.component';

describe('HotelBookingContactDataComponent', () => {
  let component: HotelBookingContactDataComponent;
  let fixture: ComponentFixture<HotelBookingContactDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingContactDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingContactDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

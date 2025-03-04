import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingAddonsComponent } from './hotel-booking-addons.component';

describe('HotelBookingAddonsComponent', () => {
  let component: HotelBookingAddonsComponent;
  let fixture: ComponentFixture<HotelBookingAddonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingAddonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingAddonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

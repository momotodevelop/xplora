import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingProgressBarComponent } from './hotel-booking-progress-bar.component';

describe('HotelBookingProgressBarComponent', () => {
  let component: HotelBookingProgressBarComponent;
  let fixture: ComponentFixture<HotelBookingProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingProgressBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

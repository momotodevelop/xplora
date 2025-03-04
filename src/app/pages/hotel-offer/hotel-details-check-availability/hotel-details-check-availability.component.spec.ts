import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsCheckAvailabilityComponent } from './hotel-details-check-availability.component';

describe('HotelDetailsCheckAvailabilityComponent', () => {
  let component: HotelDetailsCheckAvailabilityComponent;
  let fixture: ComponentFixture<HotelDetailsCheckAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsCheckAvailabilityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsCheckAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

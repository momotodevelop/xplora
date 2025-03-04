import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingRoomDataComponent } from './hotel-booking-room-data.component';

describe('HotelBookingRoomDataComponent', () => {
  let component: HotelBookingRoomDataComponent;
  let fixture: ComponentFixture<HotelBookingRoomDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingRoomDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingRoomDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { HotelFirebaseBookingService } from './hotel-firebase-booking.service';

describe('HotelFirebaseBookingService', () => {
  let service: HotelFirebaseBookingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotelFirebaseBookingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

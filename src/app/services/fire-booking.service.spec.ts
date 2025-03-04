import { TestBed } from '@angular/core/testing';

import { FireBookingService } from './fire-booking.service';

describe('FireBookingService', () => {
  let service: FireBookingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FireBookingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

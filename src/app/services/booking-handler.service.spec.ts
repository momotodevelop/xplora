import { TestBed } from '@angular/core/testing';

import { BookingHandlerService } from './booking-handler.service';

describe('BookingHandlerService', () => {
  let service: BookingHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

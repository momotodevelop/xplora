import { TestBed } from '@angular/core/testing';

import { HotelHandlerService } from './hotel-handler.service';

describe('HotelHandlerService', () => {
  let service: HotelHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotelHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

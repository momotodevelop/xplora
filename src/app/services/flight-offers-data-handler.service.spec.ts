import { TestBed } from '@angular/core/testing';

import { FlightOffersDataHandlerService } from './flight-offers-data-handler.service';

describe('FlightOffersDataHandlerService', () => {
  let service: FlightOffersDataHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlightOffersDataHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

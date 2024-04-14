import { TestBed } from '@angular/core/testing';

import { FlightOffersAmadeusService } from './flight-offers-amadeus.service';

describe('FlightOffersAmadeusService', () => {
  let service: FlightOffersAmadeusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlightOffersAmadeusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

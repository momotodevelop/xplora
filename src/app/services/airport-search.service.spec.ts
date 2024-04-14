import { TestBed } from '@angular/core/testing';

import { AirportSearchService } from './airport-search.service';

describe('AirportSearchService', () => {
  let service: AirportSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirportSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

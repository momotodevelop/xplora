import { TestBed } from '@angular/core/testing';

import { AmadeusHotelsService } from './amadeus-hotels.service';

describe('AmadeusHotelsService', () => {
  let service: AmadeusHotelsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmadeusHotelsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

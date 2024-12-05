import { TestBed } from '@angular/core/testing';

import { AmadeusAirlinesService } from './amadeus-airlines.service';

describe('AmadeusAirlinesService', () => {
  let service: AmadeusAirlinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmadeusAirlinesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { BrandedFaresService } from './branded-fares.service';

describe('BrandedFaresService', () => {
  let service: BrandedFaresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrandedFaresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

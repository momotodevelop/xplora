import { TestBed } from '@angular/core/testing';

import { PriceMutatorService } from './price-mutator.service';

describe('PriceMutatorService', () => {
  let service: PriceMutatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PriceMutatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

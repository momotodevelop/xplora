import { TestBed } from '@angular/core/testing';

import { AmadeusAuthService } from './amadeus-auth.service';

describe('AmadeusAuthService', () => {
  let service: AmadeusAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmadeusAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

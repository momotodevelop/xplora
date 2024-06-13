import { TestBed } from '@angular/core/testing';

import { XploraPaymentsService } from './xplora-payments.service';

describe('XploraPaymentsService', () => {
  let service: XploraPaymentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XploraPaymentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

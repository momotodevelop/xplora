import { TestBed } from '@angular/core/testing';

import { PaymentErrorService } from './payment-error.service';

describe('PaymentErrorService', () => {
  let service: PaymentErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

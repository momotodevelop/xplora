import { TestBed } from '@angular/core/testing';

import { VoucherTransformService } from './voucher-transform.service';

describe('VoucherTransformService', () => {
  let service: VoucherTransformService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoucherTransformService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

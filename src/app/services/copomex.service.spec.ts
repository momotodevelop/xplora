import { TestBed } from '@angular/core/testing';

import { CopomexService } from './copomex.service';

describe('CopomexService', () => {
  let service: CopomexService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopomexService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

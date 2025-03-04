import { TestBed } from '@angular/core/testing';

import { VisitCounterService } from './visit-counter.service';

describe('VisitCounterService', () => {
  let service: VisitCounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitCounterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

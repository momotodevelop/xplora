import { TestBed } from '@angular/core/testing';

import { LiteApiService } from './lite-api.service';

describe('LiteApiService', () => {
  let service: LiteApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiteApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

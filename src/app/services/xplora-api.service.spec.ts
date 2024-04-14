import { TestBed } from '@angular/core/testing';

import { XploraApiService } from './xplora-api.service';

describe('XploraApiService', () => {
  let service: XploraApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XploraApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

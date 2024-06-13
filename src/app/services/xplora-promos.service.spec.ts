import { TestBed } from '@angular/core/testing';

import { XploraPromosService } from './xplora-promos.service';

describe('XploraPromosService', () => {
  let service: XploraPromosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XploraPromosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

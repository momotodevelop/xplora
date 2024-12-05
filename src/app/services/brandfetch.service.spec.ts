import { TestBed } from '@angular/core/testing';

import { BrandfetchService } from './brandfetch.service';

describe('BrandfetchService', () => {
  let service: BrandfetchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrandfetchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

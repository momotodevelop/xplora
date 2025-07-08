import { TestBed } from '@angular/core/testing';

import { MetaHandlerService } from './meta-handler.service';

describe('MetaHandlerService', () => {
  let service: MetaHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetaHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

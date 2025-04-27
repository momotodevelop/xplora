import { TestBed } from '@angular/core/testing';

import { XploraCardServicesService } from './xplora-card-services.service';

describe('XploraCardServicesService', () => {
  let service: XploraCardServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XploraCardServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { GoogleCloudTranslateService } from './google-cloud-translate.service';

describe('GoogleCloudTranslateService', () => {
  let service: GoogleCloudTranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleCloudTranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

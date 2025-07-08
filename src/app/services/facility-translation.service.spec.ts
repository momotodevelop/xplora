import { TestBed } from '@angular/core/testing';

import { FacilityTranslationService } from './facility-translation.service';

describe('FacilityTranslationService', () => {
  let service: FacilityTranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacilityTranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

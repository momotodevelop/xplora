import { TestBed } from '@angular/core/testing';

import { GoogleTranslationService } from './google-translation.service';

describe('GoogleTranslationService', () => {
  let service: GoogleTranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleTranslationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { GoogleMapsService } from './google-maps.service';

describe('GoogleMapsService', () => {
  let service: GoogleMapsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(GoogleMapsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

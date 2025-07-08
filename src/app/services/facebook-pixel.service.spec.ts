import { TestBed } from '@angular/core/testing';

import { FacebookPixelService } from './facebook-pixel.service';

describe('FacebookPixelService', () => {
  let service: FacebookPixelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacebookPixelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

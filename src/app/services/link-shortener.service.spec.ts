import { TestBed } from '@angular/core/testing';

import { LinkShortenerService } from './link-shortener.service';

describe('LinkShortenerService', () => {
  let service: LinkShortenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinkShortenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

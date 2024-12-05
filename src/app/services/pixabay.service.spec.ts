import { TestBed } from '@angular/core/testing';

import { PixabayService } from './pixabay.service';

describe('PixabayService', () => {
  let service: PixabayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PixabayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

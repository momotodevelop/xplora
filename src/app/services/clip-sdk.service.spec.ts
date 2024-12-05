import { TestBed } from '@angular/core/testing';

import { ClipSDKService } from './clip-sdk.service';

describe('ClipSDKService', () => {
  let service: ClipSDKService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClipSDKService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

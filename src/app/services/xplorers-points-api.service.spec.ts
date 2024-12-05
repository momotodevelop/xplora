import { TestBed } from '@angular/core/testing';

import { XplorersPointsApiService } from './xplorers-points-api.service';

describe('XplorersPointsApiService', () => {
  let service: XplorersPointsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XplorersPointsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

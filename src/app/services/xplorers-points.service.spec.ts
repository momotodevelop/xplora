import { TestBed } from '@angular/core/testing';

import { XplorersPointsService } from './xplorers-points.service';

describe('XplorersPointsService', () => {
  let service: XplorersPointsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XplorersPointsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

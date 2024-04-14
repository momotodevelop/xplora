import { TestBed } from '@angular/core/testing';

import { AmadeusSeatmapService } from './amadeus-seatmap.service';

describe('AmadeusSeatmapService', () => {
  let service: AmadeusSeatmapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AmadeusSeatmapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

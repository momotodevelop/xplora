import { TestBed } from '@angular/core/testing';

import { DataCleanerService } from './data-cleaner.service';

describe('DataCleanerService', () => {
  let service: DataCleanerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataCleanerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

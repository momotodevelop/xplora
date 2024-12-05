import { TestBed } from '@angular/core/testing';

import { XploraNotificationsService } from './xplora-notifications.service';

describe('XploraNotificationsService', () => {
  let service: XploraNotificationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XploraNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { WhatsappUrlManagerService } from './whatsapp-url-manager.service';

describe('WhatsappUrlManagerService', () => {
  let service: WhatsappUrlManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsappUrlManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

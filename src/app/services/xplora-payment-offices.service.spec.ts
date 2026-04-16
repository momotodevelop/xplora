import { Injector } from '@angular/core';
import { Firestore, Timestamp } from '@angular/fire/firestore';

import { XploraPaymentOfficesService } from './xplora-payment-offices.service';

describe('XploraPaymentOfficesService', () => {
  let service: XploraPaymentOfficesService;

  beforeEach(() => {
    service = new XploraPaymentOfficesService(
      {} as Firestore,
      {} as Injector
    );
  });

  it('removes undefined optional fields from the payload before saving', () => {
    const payload = (service as any).buildOfficePayload({
      id: 'office-1',
      name: 'Oxxo',
      typeId: 'cash',
      minAmount: 100,
      maxAmount: null,
      maxPerOperation: 5000,
      fee: 12,
      delayHours: 2,
      account: '1234567890',
      referenceLabel: '',
      img: '',
      steps: [
        {
          title: '',
          elements: [
            {
              type: 'image',
              src: 'https://example.com/office.png',
              alt: '',
              caption: ''
            },
            {
              type: 'barcode',
              useOfficeAccount: true,
              label: ''
            },
            {
              type: 'text',
              text: 'Presenta este codigo al cajero'
            }
          ]
        }
      ],
      active: true
    });

    expect('createdAt' in payload).toBeFalse();
    expect('updatedAt' in payload).toBeFalse();
    expect('title' in payload.steps[0]).toBeFalse();
    expect('alt' in payload.steps[0].elements[0]).toBeFalse();
    expect('caption' in payload.steps[0].elements[0]).toBeFalse();
    expect('value' in payload.steps[0].elements[1]).toBeFalse();
    expect('label' in payload.steps[0].elements[1]).toBeFalse();
    expect(payload.steps[0].elements[1].useOfficeAccount).toBeTrue();
  });

  it('preserves timestamp fields while removing undefined properties', () => {
    const createdAt = Timestamp.fromMillis(1710000000000);
    const payload = (service as any).buildOfficePayload({
      id: 'office-2',
      name: '7 Eleven',
      typeId: 'cash',
      minAmount: 50,
      maxAmount: null,
      maxPerOperation: 3000,
      fee: 0,
      delayHours: 1,
      account: '',
      referenceLabel: '',
      img: '',
      steps: [],
      active: true,
      createdAt,
      updatedAt: undefined
    });

    expect(payload.createdAt).toBe(createdAt);
    expect('updatedAt' in payload).toBeFalse();
  });
});

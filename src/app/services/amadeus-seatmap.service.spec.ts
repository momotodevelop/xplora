import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { FlightOffer } from '../types/flight-offer-amadeus.types';
import { DuffelSeatMapResponse } from '../types/duffel-seat-map.types';
import { AmadeusSeatmapService } from './amadeus-seatmap.service';

describe('AmadeusSeatmapService', () => {
  let service: AmadeusSeatmapService;
  let httpTesting: HttpTestingController;

  const offer = {
    id: 'off_1',
    itineraries: [{
      duration: 'PT2H',
      segments: [{
        id: 'seg_1',
        departure: {iataCode: 'MEX', at: '2026-08-01T10:00:00Z'},
        arrival: {iataCode: 'CUN', at: '2026-08-01T12:00:00Z'},
        carrierCode: 'XX',
        number: '123',
        operating: {carrierCode: 'XX'},
        aircraft: {code: '320'},
        duration: 'PT2H',
        numberOfStops: 0,
        blacklistedInEU: false
      }]
    }],
    travelerPricings: [
      {travelerId: 'pas_1', travelerType: 'ADULT'},
      {travelerId: 'pas_2', travelerType: 'ADULT'}
    ]
  } as FlightOffer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AmadeusSeatmapService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('preserves Duffel sections, facilities, wings and passenger-specific services', () => {
    const response: DuffelSeatMapResponse = {
      data: [{
        id: 'sea_1',
        segment_id: 'seg_1',
        slice_id: 'sli_1',
        cabins: [{
          aisles: 1,
          cabin_class: 'economy',
          deck: 0,
          wings: {first_row_index: 0, last_row_index: 0},
          rows: [
            {
              sections: [
                {
                  elements: [{
                    type: 'seat',
                    designator: '8A',
                    name: 'Preferred',
                    disclosures: ['Adult only'],
                    available_services: [{
                      id: 'ase_1',
                      passenger_id: 'pas_1',
                      total_amount: '15.00',
                      total_currency: 'USD'
                    }]
                  }]
                },
                {
                  elements: [{
                    type: 'seat',
                    designator: '8D',
                    available_services: [{
                      id: 'ase_2',
                      passenger_id: 'pas_2',
                      total_amount: '20.00',
                      total_currency: 'USD'
                    }]
                  }]
                }
              ]
            },
            {
              sections: [
                {
                  elements: [
                    {type: 'seat', designator: '30A', available_services: []},
                    {type: 'seat', designator: '30B', available_services: []}
                  ]
                },
                {
                  elements: [
                    {type: 'seat', designator: '30C', available_services: []},
                    {type: 'seat', designator: '30D', available_services: []}
                  ]
                },
                {
                  elements: [
                    {type: 'seat', designator: '30E', available_services: []},
                    {type: 'seat', designator: '30F', available_services: []}
                  ]
                }
              ]
            },
            {
              sections: [
                {elements: [{type: 'exit_row'}]},
                {elements: []}
              ]
            },
            {
              sections: [
                {elements: [{type: 'lavatory'}]},
                {elements: [{type: 'galley'}]}
              ]
            }
          ]
        }]
      }]
    };

    service.getSeatMap([offer]).subscribe(result => {
      const seatMap = result.data[0];
      const deck = seatMap.decks[0];
      const seat = deck.seats.find(item => item.number === '8A');

      expect(seatMap.provider).toBe('DUFFEL');
      expect(seatMap.sliceId).toBe('sli_1');
      expect(deck.layoutRows?.length).toBe(4);
      expect(deck.layoutRows?.[0].sections.length).toBe(2);
      expect(deck.layoutRows?.[0].isWing).toBeTrue();
      expect(deck.layoutRows?.[1].sections.map(section =>
        section.elements.map(element => element.seat?.number)
      )).toEqual([
        ['30A', '30B', '30C'],
        ['30D', '30E', '30F']
      ]);
      expect(deck.layoutRows?.[2].hasExit).toBeTrue();
      expect(deck.layoutRows?.[3].sections[0].elements[0].type).toBe('lavatory');
      expect(seat?.name).toBe('Preferred');
      expect(seat?.disclosures).toEqual(['Adult only']);
      expect(seat?.travelerPricing[0].serviceId).toBe('ase_1');
      expect(seatMap.availableSeatsCounters).toContain({travelerId: 'pas_1', value: 1});
      expect(seatMap.availableSeatsCounters).toContain({travelerId: 'pas_2', value: 1});
    });

    const request = httpTesting.expectOne(
      `${environment.duffelApiUrl}?resource=seat_maps&offer_id=off_1`
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });
});

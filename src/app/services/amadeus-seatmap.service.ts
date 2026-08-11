import { Injectable } from '@angular/core';
import { FlightOffer, Segment } from '../types/flight-offer-amadeus.types';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, retry } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  APIResponse as GetSeatMapAPIResponse,
  Cabin,
  Deck,
  SeatElement,
  SeatMap,
  SeatMapLayoutElement,
  SeatMapLayoutRow
} from '../types/amadeus-seat-map.types';
import {
  DuffelSeatCabin,
  DuffelSeatElement,
  DuffelSeatMap,
  DuffelSeatMapResponse,
  DuffelSeatRow,
  DuffelSeatSection
} from '../types/duffel-seat-map.types';

export interface Row {
  number: number,
  wingStatus: "START"|"END"|"HAS_WING"|"NONE",
  exitRow: boolean,
  items: Item[]
}

interface Item {
  type: 'SEAT' | 'AISLE';
  seat?: SeatElement;
}

@Injectable({
  providedIn: 'root'
})
export class AmadeusSeatmapService {
  constructor(private http: HttpClient) { }

  getSeatMap(offers: FlightOffer[]): Observable<GetSeatMapAPIResponse> {
    if (!offers.length) {
      return of({meta: {count: 0}, data: []});
    }
    const requests = offers.map(offer => this.http.get<DuffelSeatMapResponse>(
      `${environment.duffelApiUrl}?resource=seat_maps`,
      {params: {offer_id: offer.id}}
    ).pipe(
      retry(2),
      map(response => response.data.map(seatMap => this.toLegacySeatMap(seatMap, offer)))
    ));
    return forkJoin(requests).pipe(
      map(results => {
        const data = results.flat();
        return {meta: {count: data.length}, data};
      })
    );
  }

  private toLegacySeatMap(seatMap: DuffelSeatMap, offer: FlightOffer): SeatMap {
    const segment = this.findSegment(offer, seatMap.segment_id);
    const decks = seatMap.cabins.map(cabin => this.toLegacyDeck(cabin));
    const seats = decks.flatMap(deck => deck.seats);
    const travelerCounters = offer.travelerPricings.map(traveler => ({
      travelerId: traveler.travelerId,
      value: seats.filter(seat => seat.travelerPricing.some(pricing =>
        pricing.travelerId === traveler.travelerId
        && pricing.seatAvailabilityStatus === 'AVAILABLE'
      )).length
    }));
    const availableForAnyTraveler = seats.filter(seat =>
      seat.travelerPricing.some(pricing => pricing.seatAvailabilityStatus === 'AVAILABLE')
    ).length;

    return {
      id: seatMap.id,
      type: 'seatmap',
      departure: {
        iataCode: segment.departure.iataCode,
        terminal: segment.departure.terminal,
        at: new Date(segment.departure.at)
      },
      arrival: {
        iataCode: segment.arrival.iataCode,
        terminal: segment.arrival.terminal,
        at: new Date(segment.arrival.at)
      },
      carrierCode: segment.carrierCode,
      number: segment.number,
      operating: segment.operating,
      aircraft: segment.aircraft,
      class: seatMap.cabins[0]?.cabin_class?.toUpperCase() || 'ECONOMY',
      flightOfferId: offer.id,
      segmentId: segment.id,
      decks,
      aircraftCabinAmenities: {
        power: {isChargeable: false, powerType: '', usbType: ''},
        seat: {legSpace: 0, spaceUnit: '', tilt: '', medias: []},
        wifi: {isChargeable: false, wifiCoverage: ''},
        food: {isChargeable: false, foodType: ''},
        beverage: {isChargeable: false, beverageType: ''}
      },
      availableSeatsCounters: [
        ...travelerCounters,
        {travelerId: 'all', value: availableForAnyTraveler}
      ],
      provider: 'DUFFEL',
      sliceId: seatMap.slice_id
    };
  }

  private toLegacyDeck(cabin: DuffelSeatCabin): Deck {
    const rowNumbersByIndex = cabin.rows.map(row => this.getDuffelRowNumber(row));
    const seats: SeatElement[] = [];
    let width = 1;

    const layoutRows: SeatMapLayoutRow[] = cabin.rows.map((row, rowIndex) => {
      let column = 0;
      const rowNumber = rowNumbersByIndex[rowIndex];
      const hasExitRow = row.sections.some(section => section.elements.some(element => element.type === 'exit_row'));
      const followsExitRow = rowIndex > 0 && cabin.rows[rowIndex - 1].sections
        .some(section => section.elements.some(element => element.type === 'exit_row'));
      const normalizedSections = this.normalizeSeatSections(row, cabin.aisles);

      const sections = normalizedSections.map((section, sectionIndex) => {
        if (sectionIndex > 0) column += 1;
        const elements = section.elements.map(element => {
          const currentColumn = column++;
          if (element.type !== 'seat' || !element.designator) {
            return this.toLayoutElement(element);
          }

          const services = element.available_services ?? [];
          const seat: SeatElement = {
            cabin: cabin.cabin_class.toUpperCase() as SeatElement['cabin'],
            number: element.designator,
            characteristicsCodes: followsExitRow ? ['EXIT'] : [],
            travelerPricing: services.length ? services.map(service => ({
              travelerId: service.passenger_id,
              seatAvailabilityStatus: 'AVAILABLE' as const,
              serviceId: service.id,
              price: {
                currency: service.total_currency,
                total: service.total_amount,
                base: service.total_amount,
                taxes: []
              }
            })) : [{
              travelerId: 'all',
              seatAvailabilityStatus: 'BLOCKED' as const
            }],
            coordinates: {x: currentColumn, y: rowNumber ?? rowIndex},
            provider: 'DUFFEL',
            serviceIds: services.map(service => service.id),
            name: element.name || undefined,
            disclosures: element.disclosures ?? []
          };
          seats.push(seat);
          return this.toLayoutElement(element, seat);
        });
        return {elements};
      });
      width = Math.max(width, column);

      return {
        index: rowIndex,
        rowNumber,
        hasExit: hasExitRow,
        isWing: Boolean(
          cabin.wings
          && rowIndex >= cabin.wings.first_row_index
          && rowIndex <= cabin.wings.last_row_index
        ),
        sections
      };
    });

    const seatRowNumbers = rowNumbersByIndex.filter((row): row is number => row !== undefined);
    const firstRow = seatRowNumbers.length ? Math.min(...seatRowNumbers) : 1;
    const lastRow = seatRowNumbers.length ? Math.max(...seatRowNumbers) : firstRow;
    const exitRows = layoutRows
      .filter(row => row.hasExit)
      .map(row => this.nearestSeatRow(rowNumbersByIndex, row.index))
      .filter((row): row is number => row !== undefined);
    const firstWingIndex = cabin.wings?.first_row_index;
    const lastWingIndex = cabin.wings?.last_row_index;

    return {
      deckType: cabin.deck === 0 ? 'MAIN' : `UPPER_${cabin.deck}`,
      cabinClass: this.toCabin(cabin.cabin_class),
      cabinName: cabin.cabin_class,
      deckConfiguration: {
        width,
        length: Math.max(cabin.rows.length, 1),
        startSeatRow: firstRow,
        endSeatRow: lastRow,
        startWingsX: 0,
        endWingsX: 0,
        startWingsRow: firstWingIndex === undefined
          ? 0
          : this.nearestSeatRow(rowNumbersByIndex, firstWingIndex) ?? 0,
        endWingsRow: lastWingIndex === undefined
          ? 0
          : this.nearestSeatRow(rowNumbersByIndex, lastWingIndex) ?? 0,
        exitRowsX: Array.from(new Set(exitRows)).sort((a, b) => a - b)
      },
      seats,
      layoutRows
    };
  }

  private normalizeSeatSections(row: DuffelSeatRow, aisles: number): DuffelSeatSection[] {
    const expectedSectionCount = Math.max(aisles + 1, 1);
    if (row.sections.length === expectedSectionCount) return row.sections;

    const elements = row.sections.flatMap(section => section.elements);
    const hasOnlyFixedWidthElements = elements.every(element =>
      element.type === 'seat'
      || element.type === 'empty'
      || element.type === 'bassinet'
    );

    if (!hasOnlyFixedWidthElements) return row.sections;

    return Array.from({length: expectedSectionCount}, (_, sectionIndex) => {
      const start = Math.round(sectionIndex * elements.length / expectedSectionCount);
      const end = Math.round((sectionIndex + 1) * elements.length / expectedSectionCount);
      return {elements: elements.slice(start, end)};
    });
  }

  private toLayoutElement(element: DuffelSeatElement, seat?: SeatElement): SeatMapLayoutElement {
    return {
      type: element.type,
      name: element.name || undefined,
      seat
    };
  }

  private getDuffelRowNumber(row: DuffelSeatRow): number | undefined {
    const seat = row.sections
      .flatMap(section => section.elements)
      .find(element => element.type === 'seat' && element.designator);
    if (!seat?.designator) return undefined;
    const rowNumber = Number.parseInt(seat.designator, 10);
    return Number.isNaN(rowNumber) ? undefined : rowNumber;
  }

  private nearestSeatRow(rowNumbers: Array<number | undefined>, rowIndex: number): number | undefined {
    if (rowNumbers[rowIndex] !== undefined) return rowNumbers[rowIndex];
    for (let distance = 1; distance < rowNumbers.length; distance++) {
      const after = rowNumbers[rowIndex + distance];
      if (after !== undefined) return after;
      const before = rowNumbers[rowIndex - distance];
      if (before !== undefined) return before;
    }
    return undefined;
  }

  private toCabin(cabinClass: string): Cabin {
    const normalized = cabinClass.toUpperCase();
    if (
      normalized === 'ECONOMY'
      || normalized === 'PREMIUM_ECONOMY'
      || normalized === 'BUSINESS'
      || normalized === 'FIRST'
    ) {
      return normalized;
    }
    return 'ECONOMY';
  }

  private findSegment(offer: FlightOffer, segmentId: string): Segment {
    const segments = offer.itineraries.flatMap(itinerary => itinerary.segments);
    return segments.find(segment => segment.id === segmentId) || segments[0];
  }
}

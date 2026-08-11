import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, retry } from 'rxjs';
import { Dictionaries, FareDetailsBySegment, FlightChangeCondition, FlightOffer, FlightOfferConditions, FlightOfferSearchResponse, Itinerary, Segment, TravelerPricing } from '../types/flight-offer-amadeus.types'
import { environment } from '../../environments/environment';
import { FlightClassType } from '../pages/flight-search/search-topbar/search-topbar.component';

interface DuffelResponse<T> {
  data: T;
}

interface DuffelPlace {
  iata_code: string;
  iata_country_code: string;
  iata_city_code?: string | null;
  city_name?: string | null;
  name: string;
}

interface DuffelAirline {
  iata_code?: string | null;
  name: string;
  logo_lockup_url?: string | null;
  logo_symbol_url?: string | null;
}

interface DuffelAircraft {
  iata_code?: string | null;
  name?: string | null;
}

interface DuffelSegmentPassenger {
  passenger_id: string;
  cabin_class: string;
  cabin_class_marketing_name?: string | null;
  fare_basis_code?: string | null;
  baggages?: Array<{type: 'carry_on' | 'checked'; quantity: number}>;
}

interface DuffelSegment {
  id: string;
  departing_at: string;
  arriving_at: string;
  duration: string;
  origin: DuffelPlace;
  destination: DuffelPlace;
  origin_terminal?: string | null;
  destination_terminal?: string | null;
  marketing_carrier: DuffelAirline;
  marketing_carrier_flight_number: string;
  operating_carrier: DuffelAirline;
  aircraft?: DuffelAircraft | null;
  stops?: DuffelStop[];
  passengers?: DuffelSegmentPassenger[];
}

interface DuffelStop {
  id: string;
  duration: string;
  arriving_at?: string | null;
  departing_at?: string | null;
  airport: DuffelPlace;
}

interface DuffelCondition {
  allowed: boolean;
  penalty_amount?: string | null;
  penalty_currency?: string | null;
}

interface DuffelConditions {
  change_before_departure?: DuffelCondition | null;
  refund_before_departure?: DuffelCondition | null;
}

interface DuffelSlice {
  duration: string;
  segments: DuffelSegment[];
  conditions?: DuffelConditions | null;
}

interface DuffelPassenger {
  id: string;
  type: string;
}

interface DuffelOffer {
  id: string;
  expires_at: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount?: string | null;
  owner: DuffelAirline;
  payment_requirements?: {requires_instant_payment?: boolean};
  conditions?: DuffelConditions | null;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
}

interface DuffelOfferRequest {
  id: string;
  offers: DuffelOffer[];
}

@Injectable({
  providedIn: 'root'
})
export class FlightOffersAmadeusService {
  constructor(private http: HttpClient) { }

  searchFlightOffers(
    origin: string,
    destination: string,
    departureDate: string,
    travelClasses: FlightClassType = 'ECONOMY',
    passengers: {adults: number; childrens: number; infants: number} = {adults: 1, childrens: 0, infants: 0}
  ): Observable<FlightOfferSearchResponse> {
    const duffelPassengers = [
      ...Array.from({length: Math.max(passengers.adults, 1)}, () => ({type: 'adult'})),
      ...Array.from({length: Math.max(passengers.childrens, 0)}, () => ({type: 'child'})),
      ...Array.from({length: Math.max(passengers.infants, 0)}, () => ({type: 'infant_without_seat'}))
    ];
    const body = {
      data: {
        cabin_class: travelClasses.toLowerCase(),
        slices: [{origin, destination, departure_date: departureDate}],
        passengers: duffelPassengers
      }
    };
    return this.http.post<DuffelResponse<DuffelOfferRequest>>(
      `${environment.duffelApiUrl}?resource=offers`,
      body
    ).pipe(
      retry(2),
      map(response => this.toLegacyResponse(response.data))
    );
  }

  private toLegacyResponse(request: DuffelOfferRequest): FlightOfferSearchResponse {
    const dictionaries: Dictionaries = {locations: {}, aircraft: {}, currencies: {}, carriers: {}};
    const data = (request.offers || []).map(offer => this.toLegacyOffer(offer, dictionaries));
    return {
      meta: {count: data.length, links: {self: request.id}},
      data,
      dictionaries
    };
  }

  private toLegacyOffer(offer: DuffelOffer, dictionaries: Dictionaries): FlightOffer {
    const total = Number(offer.total_amount);
    const base = Number(offer.base_amount);
    const passengerCount = Math.max(offer.passengers?.length || 1, 1);
    const itineraries = offer.slices.map(slice => this.toLegacyItinerary(slice, dictionaries));
    const travelerPricings = (offer.passengers || []).map(passenger =>
      this.toLegacyTraveler(passenger, offer, total / passengerCount, base / passengerCount)
    );
    const validatingCode = offer.owner?.iata_code || itineraries[0]?.segments[0]?.carrierCode || '';
    if (validatingCode) dictionaries.carriers[validatingCode] = offer.owner.name;
    dictionaries.currencies[offer.total_currency] = offer.total_currency;

    return {
      type: 'flight-offer',
      id: offer.id,
      source: 'DUFFEL',
      instantTicketingRequired: Boolean(offer.payment_requirements?.requires_instant_payment),
      nonHomogeneous: false,
      oneWay: itineraries.length === 1,
      lastTicketingDate: offer.expires_at,
      numberOfBookableSeats: 9,
      itineraries,
      price: {
        currency: offer.total_currency,
        total,
        base,
        fees: offer.tax_amount ? [{amount: offer.tax_amount, type: 'TAX'}] : [],
        grandTotal: total
      },
      pricingOptions: {fareType: ['PUBLISHED'], includedCheckedBagsOnly: false},
      validatingAirlineCodes: validatingCode ? [validatingCode] : [],
      travelerPricings,
      airlineLogoUrl: this.getAirlineLogoUrl(offer.owner),
      conditions: this.toLegacyConditions(offer.conditions)
    };
  }

  private toLegacyItinerary(slice: DuffelSlice, dictionaries: Dictionaries): Itinerary {
    return {
      duration: slice.duration,
      segments: slice.segments.map(segment => this.toLegacySegment(segment, dictionaries)),
      conditions: {
        changeBeforeDeparture: this.toLegacyCondition(slice.conditions?.change_before_departure)
      }
    };
  }

  private toLegacySegment(segment: DuffelSegment, dictionaries: Dictionaries): Segment {
    const carrierCode = segment.marketing_carrier?.iata_code || segment.operating_carrier?.iata_code || '';
    const operatingCode = segment.operating_carrier?.iata_code || carrierCode;
    if (carrierCode) dictionaries.carriers[carrierCode] = segment.marketing_carrier.name;
    if (operatingCode) dictionaries.carriers[operatingCode] = segment.operating_carrier.name;
    for (const place of [segment.origin, segment.destination]) {
      dictionaries.locations[place.iata_code] = {
        cityCode: place.iata_city_code || place.iata_code,
        countryCode: place.iata_country_code
      };
    }
    const aircraftCode = segment.aircraft?.iata_code || '';
    if (aircraftCode) dictionaries.aircraft[aircraftCode] = segment.aircraft?.name || aircraftCode;
    return {
      departure: {
        iataCode: segment.origin.iata_code,
        terminal: segment.origin_terminal || undefined,
        at: segment.departing_at
      },
      arrival: {
        iataCode: segment.destination.iata_code,
        terminal: segment.destination_terminal || undefined,
        at: segment.arriving_at
      },
      carrierCode,
      carrierLogoUrl: this.getAirlineLogoUrl(segment.marketing_carrier)
        || this.getAirlineLogoUrl(segment.operating_carrier),
      number: segment.marketing_carrier_flight_number,
      aircraft: {code: aircraftCode},
      operating: {carrierCode: operatingCode},
      duration: segment.duration,
      id: segment.id,
      numberOfStops: segment.stops?.length || 0,
      stops: (segment.stops || []).map(stop => ({
        id: stop.id,
        duration: stop.duration,
        arrivingAt: stop.arriving_at || undefined,
        departingAt: stop.departing_at || undefined,
        airport: {
          iataCode: stop.airport.iata_code,
          name: stop.airport.name,
          cityName: stop.airport.city_name || undefined
        }
      })),
      blacklistedInEU: false
    };
  }

  private toLegacyConditions(conditions?: DuffelConditions | null): FlightOfferConditions {
    return {
      changeBeforeDeparture: this.toLegacyCondition(conditions?.change_before_departure),
      refundBeforeDeparture: this.toLegacyCondition(conditions?.refund_before_departure)
    };
  }

  private getAirlineLogoUrl(airline?: DuffelAirline | null): string | undefined {
    return airline?.logo_lockup_url || airline?.logo_symbol_url || undefined;
  }

  private toLegacyCondition(condition?: DuffelCondition | null): FlightChangeCondition | null {
    if (!condition) return null;
    return {
      allowed: condition.allowed,
      penaltyAmount: condition.penalty_amount ?? null,
      penaltyCurrency: condition.penalty_currency ?? null
    };
  }

  private toLegacyTraveler(
    passenger: DuffelPassenger,
    offer: DuffelOffer,
    total: number,
    base: number
  ): TravelerPricing {
    const fareDetailsBySegment: FareDetailsBySegment[] = offer.slices.flatMap(slice =>
      slice.segments.map(segment => {
        const details = segment.passengers?.find(item => item.passenger_id === passenger.id);
        const checked = details?.baggages?.find(item => item.type === 'checked')?.quantity || 0;
        const cabin = String(details?.cabin_class || 'economy').toUpperCase() as FareDetailsBySegment['cabin'];
        return {
          segmentId: segment.id,
          cabin,
          fareBasis: details?.fare_basis_code || '',
          class: cabin.charAt(0),
          includedCheckedBags: {quantity: checked},
          includedCabinBags: {
            quantity: details?.baggages?.find(item => item.type === 'carry_on')?.quantity || 0
          },
          brandedFare: details?.cabin_class_marketing_name || undefined,
          brandedFareLabel: details?.cabin_class_marketing_name || undefined
        };
      })
    );
    return {
      travelerId: passenger.id,
      fareOption: 'STANDARD',
      travelerType: passenger.type.toUpperCase(),
      price: {
        currency: offer.total_currency,
        total,
        base,
        fees: [],
        grandTotal: total
      },
      fareDetailsBySegment
    };
  }
  getAirlineName(code: string, dictionaries:Dictionaries): string {
    return dictionaries?.carriers?.[code] ?? 'Desconocido';
  }

  getAirportName(code: string, dictionaries:Dictionaries): string {
    return dictionaries?.locations?.[code]?.cityCode ?? 'Desconocido';
  }

  getCurrencyName(code: string, dictionaries:Dictionaries): string {
    return dictionaries?.currencies?.[code] ?? 'Desconocido';
  }

  getAircraftName(code: string, dictionaries:Dictionaries): string {
    return dictionaries?.aircraft?.[code] ?? 'Desconocido';
  }
}

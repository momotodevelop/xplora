import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of, retry, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { FlightChangeCondition, FlightOffer } from '../types/flight-offer-amadeus.types';

interface DuffelOfferResponse {
  data: DuffelOfferWithServices;
}

interface DuffelOfferWithServices {
  id: string;
  available_services?: DuffelAvailableService[];
  conditions?: {
    change_before_departure?: {
      allowed: boolean;
      penalty_amount?: string | null;
      penalty_currency?: string | null;
    } | null;
  } | null;
}

export interface DuffelAvailableService {
  id: string;
  type: string;
  passenger_ids?: string[];
  segment_ids?: string[];
  total_amount: string;
  total_currency: string;
  maximum_quantity?: number;
  metadata?: Record<string, unknown>;
}

export interface DuffelBaggageService extends DuffelAvailableService {
  type: 'baggage';
}

export interface DuffelOfferAncillaryInfo {
  baggageServices: DuffelBaggageService[];
  changeCondition?: FlightChangeCondition | null;
}

@Injectable({
  providedIn: 'root'
})
export class DuffelAncillariesService {
  private readonly offerInfoCache = new Map<string, Observable<DuffelOfferAncillaryInfo>>();

  constructor(private http: HttpClient) {}

  getOfferAncillaryInfo(offers: FlightOffer[]): Observable<Record<string, DuffelOfferAncillaryInfo>> {
    const uniqueOffers = Array.from(new Map(offers.map(offer => [offer.id, offer])).values());
    if (!uniqueOffers.length) return of({});

    return forkJoin(uniqueOffers.map(offer => this.getOfferInfo(offer.id).pipe(
      map(info => ({offerId: offer.id, info}))
    ))).pipe(
      map(results => results.reduce((acc, result) => {
        acc[result.offerId] = result.info;
        return acc;
      }, {} as Record<string, DuffelOfferAncillaryInfo>))
    );
  }

  getBaggageServices(offers: FlightOffer[]): Observable<Record<string, DuffelBaggageService[]>> {
    return this.getOfferAncillaryInfo(offers).pipe(
      map(infoByOffer => Object.entries(infoByOffer).reduce((acc, [offerId, info]) => {
        acc[offerId] = info.baggageServices;
        return acc;
      }, {} as Record<string, DuffelBaggageService[]>))
    );
  }

  private getOfferInfo(offerId: string): Observable<DuffelOfferAncillaryInfo> {
    const cached = this.offerInfoCache.get(offerId);
    if (cached) return cached;

    const request = this.http.get<DuffelOfferResponse>(
      `${environment.duffelApiUrl}?resource=offer`,
      {params: {offer_id: offerId, return_available_services: true}}
    ).pipe(
      retry(2),
      map(response => {
        const rawCondition = response.data.conditions?.change_before_departure;
        return {
          baggageServices: (response.data.available_services || [])
            .filter((service): service is DuffelBaggageService => service.type === 'baggage'),
          changeCondition: rawCondition === null
            ? null
            : rawCondition
              ? {
                allowed: rawCondition.allowed,
                penaltyAmount: rawCondition.penalty_amount,
                penaltyCurrency: rawCondition.penalty_currency
              }
              : undefined
        };
      }),
      shareReplay({bufferSize: 1, refCount: false})
    );
    this.offerInfoCache.set(offerId, request);
    return request;
  }
}

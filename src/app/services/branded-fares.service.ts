import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FareDetailsBySegment, FlightOffer, IncludedCheckedBags } from '../types/flight-offer-amadeus.types';
import { AmadeusAuthService } from './amadeus-auth.service';
import { mergeMap, retry, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BrandedFaresService {

  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }

  private generateRandomId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  get(offers: FlightOffer[]) {
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (!token) {
          return throwError(() => new Error('Token no disponible'));
        }

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-HTTP-Method-Override': 'GET',
          'Access-Control-Allow-Origin': '*'
        });

        const body = {
          data: {
            type: 'flight-offers-upselling',
            flightOffers: offers.map(originalOffer => {
              const offerId = originalOffer.id || this.generateRandomId();

              const offer = {
                ...originalOffer,
                id: offerId,
                itineraries: originalOffer.itineraries.map(itinerary => ({
                  ...itinerary,
                  segments: itinerary.segments.map(segment => ({
                    ...segment,
                    id: offerId + segment.id
                  }))
                })),
                travelerPricings: originalOffer.travelerPricings.map(traveler => ({
                  ...traveler,
                  fareDetailsBySegment: traveler.fareDetailsBySegment.map(segment => ({
                    ...segment,
                    segmentId: offerId + segment.segmentId
                  }))
                }))
              };

              return offer;
            })
          }
        };
        console.log('Branded fares request body:', body);
        return this.http.post(
          `https://cors-anywhere.com/${environment.amadeusApiUrl}/v1/shopping/flight-offers/upselling`,
          body,
          { headers }
        ).pipe(retry(3));
      })
    );
  }
  parseUpsellResponse(response: any) {
    const combinations = response?.meta?.oneWayUpselledCombinations ?? [];
    const allOffers = response.data;
    return combinations.map((comb: { flightOfferId: string; upselledFlightOfferIds: string[]; }) => {
      const baseOfferId = comb.flightOfferId;
      const baseOffer = allOffers.find((o: { id: string; }) => o.id === baseOfferId) as FlightOffer | undefined;
      const upselledOffers = comb.upselledFlightOfferIds
        .map((id: string) => allOffers.find((o: { id: string; }) => o.id === id) as FlightOffer | undefined)
        .filter((offer): offer is FlightOffer => Boolean(offer))
        .map((offer: FlightOffer) => {
          const fareDetails = offer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0] as FareDetailsBySegment | undefined;
          return {
            id: offer.id,
            offer,
            total: offer?.price?.total,
            currency: offer?.price?.currency,
            brandedFare: fareDetails?.brandedFare,
            brandedFareLabel: fareDetails?.brandedFareLabel,
            amenities: (fareDetails as any)?.amenities || [],
            cabin: fareDetails?.cabin,
            includedBags: fareDetails?.includedCheckedBags as IncludedCheckedBags | undefined,
          };
        });

      const baseFareDetails = baseOffer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0] as FareDetailsBySegment | undefined;
      return {
        baseOfferId: baseOffer?.id ?? baseOfferId,
        baseOffer,
        brandedFare: baseFareDetails?.brandedFare,
        total: baseOffer?.price?.total,
        currency: baseOffer?.price?.currency,
        upselledOffers,
      };
    });
  }
}

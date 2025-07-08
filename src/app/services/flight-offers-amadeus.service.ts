import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, mergeMap, retry, throwError } from 'rxjs';
import { Dictionaries, FlightOfferSearchResponse } from '../types/flight-offer-amadeus.types'
import { AmadeusAuthService } from './amadeus-auth.service';
import { environment } from '../../environments/environment';
import { FlightClassType } from '../pages/flight-search/search-topbar/search-topbar.component';
export const PRICE_MUTATOR_FLIGHTS: number = -50;

@Injectable({
  providedIn: 'root'
})
export class FlightOffersAmadeusService {
  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }

  searchFlightOffers(origin: string, destination: string, departureDate: string, travelClasses:FlightClassType='ECONOMY'): Observable<FlightOfferSearchResponse> {
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        const params = {
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate: departureDate,
          adults: 1,
          currencyCode: "MXN",
          travelClass: travelClasses
        };

        return this.http.get<FlightOfferSearchResponse>(`${environment.amadeusApiUrl}/v2/shopping/flight-offers`, { headers: headers, params: params }).pipe(retry(5)).pipe(map(response => {
          return {
            ...response,
            data: response.data.map(offer=>{
              return {
                ...offer,
                price: {
                  ...offer.price,
                  base: this._applyPriceModifier(parseInt(offer.price.base as string), PRICE_MUTATOR_FLIGHTS),
                  grandTotal: this._applyPriceModifier(parseInt(offer.price.grandTotal as string), PRICE_MUTATOR_FLIGHTS),
                  total: this._applyPriceModifier(parseInt(offer.price.total as string), PRICE_MUTATOR_FLIGHTS)
                },
                travelerPricings: offer.travelerPricings.map(traveler => {
                  return {
                    ...traveler,
                    price: {
                      ...traveler.price,
                      base: this._applyPriceModifier(parseInt(traveler.price.base as string), PRICE_MUTATOR_FLIGHTS),
                      grandTotal: this._applyPriceModifier(parseInt(traveler.price.grandTotal as string), PRICE_MUTATOR_FLIGHTS),
                      total: this._applyPriceModifier(parseInt(traveler.price.total as string), PRICE_MUTATOR_FLIGHTS)
                    }
                  }
                })
              }
            })
          }
        })).pipe(retry(10));
      })
    );
  }
  private _applyPriceModifier(originalPrice: number, percentageModifier: number, round: boolean = true): number {
    const modified = originalPrice + (originalPrice * (percentageModifier / 100));
    return round ? Math.round(modified) : modified;
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
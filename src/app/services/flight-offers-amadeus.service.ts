import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, mergeMap, throwError } from 'rxjs';
import { Dictionaries, FlightOfferSearchResponse } from '../types/flight-offer-amadeus.types'
import { AmadeusAuthService } from './amadeus-auth.service';
import { environment } from '../../environments/environment';
import { FlightClassType } from '../pages/flight-search/search-topbar/search-topbar.component';

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

        return this.http.get<FlightOfferSearchResponse>(`${environment.amadeusApiUrl}/v2/shopping/flight-offers`, { headers: headers, params: params });
      })
    );
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

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FlightOffer } from '../types/flight-offer-amadeus.types';
import { AmadeusAuthService } from './amadeus-auth.service';
import { mergeMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment'

@Injectable({
  providedIn: 'root'
})
export class BrandedFaresService {

  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }

  get(offers:FlightOffer[]){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        let data = {
          type: "flight-offer-upsell",
          flightOffers: offers
        }
        return this.http.post(`${environment.amadeusApiUrl}/v1/shopping/flight-offers/upselling`, data, { headers: headers });
      })
    );
  }
}

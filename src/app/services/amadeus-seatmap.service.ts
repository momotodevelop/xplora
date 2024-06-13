import { Injectable, Input } from '@angular/core';
import { FlightOffer, FlightOfferSearchResponse } from '../types/flight-offer-amadeus.types';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AmadeusAuthService } from './amadeus-auth.service';
import { mergeMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Deck, APIResponse as GetSeatMapAPIResponse, SeatElement } from '../types/amadeus-seat-map.types';

export interface Row{
  number: number,
  wingStatus: "START"|"END"|"HAS_WING"|"NONE",
  exitRow: boolean,
  items: Item[]
}

interface Item {
  type: 'SEAT' | 'AISLE';
  seat?: SeatElement;  // Solo se incluye si type es 'SEAT'
}

@Injectable({
  providedIn: 'root'
})
export class AmadeusSeatmapService {
  @Input() deck!:Deck;
  rows: Row[] = [];
  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }

  getSeatMap(offers:FlightOffer[]){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.post<GetSeatMapAPIResponse>(`${environment.amadeusApiUrl}/v1/shopping/seatmaps`, {data: offers},{ headers: headers});
      })
    );
  }
}

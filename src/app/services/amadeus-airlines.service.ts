import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AmadeusAuthService } from './amadeus-auth.service';

interface AirlineResponse {
  meta: {
    count: number;
    links: {
      self: string;
    };
  };
  data: Airline[];
}

interface Airline {
  type: string; // Puede ser más específico si siempre será "airline"
  iataCode: string;
  icaoCode: string;
  businessName: string;
  commonName: string;
}


@Injectable({
  providedIn: 'root'
})
export class AmadeusAirlinesService {

  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }
  getAirlineInfo(iata:string){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<AirlineResponse>(`${environment.amadeusApiUrl}/v1/reference-data/airlines`, { headers: headers, params: {airlineCodes: iata}});
      })
    );
  }
}

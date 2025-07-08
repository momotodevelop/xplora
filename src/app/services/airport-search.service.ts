import {environment} from '../../environments/environment'
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, mergeMap, Observable, retry, throwError } from 'rxjs';
import { AmadeusGetLocationResponse, AmadeusLocation, AmadeusSearchLocationResponse } from '../types/amadeus-airport-response.types';
import { DirectDestination, DirectDestinationsResponse } from '../types/amadeus-direct-airport-response.types';
import { AmadeusAuthService } from './amadeus-auth.service';
type LocationTypes = "AIRPORT"|"CITY";
@Injectable({
  providedIn: 'root'
})
export class AirportSearchService {

  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }

  searchAirports(keyword: string, token:string, types:LocationTypes[]=["AIRPORT", "CITY"]): Observable<AmadeusSearchLocationResponse> {
    const subTypes = types.join(',');
    const url = `${environment.amadeusApiUrl+'/v1/reference-data/locations'}?subType=${subTypes}&keyword=${keyword}&page[limit]=5&page[offset]=0`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer '+token
    });
    return this.http.get<AmadeusSearchLocationResponse>(url, { headers }).pipe(retry(10)); // Reintenta la solicitud hasta 10 veces en caso de error
  }
  getLocation(id: string, token:string): Observable<AmadeusGetLocationResponse> {
    const url = environment.amadeusApiUrl+'/v1/reference-data/locations/'+id;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer '+token
    });
    return this.http.get<AmadeusGetLocationResponse>(url, { headers }).pipe(retry(10));
  }

  searchDirectDestinations(iataCode: string, token: string): Observable<DirectDestinationsResponse> {
    const url = `${environment.amadeusApiUrl+'/v1/airport/direct-destinations'}?departureAirportCode=${iataCode}&max=5`;
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });

    return this.http.get<DirectDestinationsResponse>(url, { headers }).pipe(retry(10));
  }
  getNearbyAirports(lat: number, lng: number, token?:string) {
    const url = environment.amadeusApiUrl+"/v1/reference-data/locations/airports";
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<AmadeusSearchLocationResponse>(url, { headers: headers, params: {latitude: lat, longitude: lng}}).pipe(retry(10));
      })
    );
  }
  convertirAmadeusLocationADirectDestination(amadeusLocation: AmadeusLocation): DirectDestination {
    const directDestination: DirectDestination = {
      type: amadeusLocation.type,
      subtype: amadeusLocation.subType === 'AIRPORT' ? 'airport' : 'city',
      name: amadeusLocation.name,
      iataCode: amadeusLocation.iataCode,
      geoCode: {
        latitude: amadeusLocation.geoCode.latitude,
        longitude: amadeusLocation.geoCode.longitude
      },
      address: {
        cityName: amadeusLocation.address.cityName,
        countryName: amadeusLocation.address.countryName,
        stateCode: amadeusLocation.address.cityCode,
        regionCode: amadeusLocation.address.regionCode
      },
      timeZone: {
        offset: amadeusLocation.timeZoneOffset,
        referenceLocalDateTime: new Date().toISOString() // Puedes ajustar esto según sea necesario
      },
      metrics: {
        relevance: amadeusLocation.analytics?.travelers?.score || 0 // Si el campo no está presente, asigna un valor por defecto
      }
    };

    return directDestination;
  }
}

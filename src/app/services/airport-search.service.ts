import {environment} from '../../environments/environment'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, retry } from 'rxjs';
import { AmadeusGetLocationResponse, AmadeusLocation, AmadeusSearchLocationResponse } from '../types/amadeus-airport-response.types';
import { DirectDestination, DirectDestinationsResponse } from '../types/amadeus-direct-airport-response.types';

type LocationTypes = "AIRPORT"|"CITY";

interface DuffelPlace {
  id: string;
  type: 'airport' | 'city';
  name: string;
  iata_code: string;
  iata_city_code?: string | null;
  iata_country_code: string;
  city_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  time_zone?: string | null;
  airports?: DuffelPlace[] | null;
}

interface DuffelPlacesResponse {
  data: DuffelPlace[];
}

@Injectable({
  providedIn: 'root'
})
export class AirportSearchService {
  constructor(private http: HttpClient) { }

  searchAirports(
    keyword: string,
    _token?: string,
    types: LocationTypes[] = ["AIRPORT", "CITY"]
  ): Observable<AmadeusSearchLocationResponse> {
    return this.getPlaces({query: keyword}).pipe(
      map(response => {
        const allowedTypes = new Set(types.map(type => type.toLowerCase()));
        const data = response.data
          .filter(place => allowedTypes.has(place.type))
          .slice(0, 5)
          .map(place => this.toLegacyLocation(place));
        return this.toSearchResponse(data);
      })
    );
  }

  getLocation(id: string, _token?: string): Observable<AmadeusGetLocationResponse> {
    const iataCode = id.replace(/^[AC]/i, '').toUpperCase();
    return this.getPlaces({query: iataCode}).pipe(
      map(response => {
        const place = response.data.find(item => item.iata_code === iataCode) || response.data[0];
        if (!place) throw new Error(`No se encontró la ubicación ${iataCode} en Duffel.`);
        return {
          meta: {links: {self: `${environment.duffelApiUrl}?resource=places&query=${iataCode}`}},
          data: this.toLegacyLocation(place)
        };
      })
    );
  }

  /**
   * Duffel does not expose an equivalent to Amadeus Direct Destinations.
   * Returning an empty optional suggestion set keeps the core place search
   * available without sourcing route data from the old provider.
   */
  searchDirectDestinations(_iataCode: string, _token?: string): Observable<DirectDestinationsResponse> {
    return of({
      meta: {count: 0, links: {self: environment.duffelApiUrl}},
      data: []
    });
  }

  getNearbyAirports(lat: number, lng: number, _token?: string): Observable<AmadeusSearchLocationResponse> {
    return this.getPlaces({
      lat: String(lat),
      lng: String(lng),
      rad: '100000'
    }).pipe(
      map(response => this.toSearchResponse(
        response.data
          .filter(place => place.type === 'airport')
          .slice(0, 10)
          .map(place => this.toLegacyLocation(place))
      ))
    );
  }

  convertirAmadeusLocationADirectDestination(location: AmadeusLocation): DirectDestination {
    return {
      type: location.type,
      subtype: location.subType === 'AIRPORT' ? 'airport' : 'city',
      name: location.name,
      iataCode: location.iataCode,
      geoCode: {
        latitude: location.geoCode.latitude,
        longitude: location.geoCode.longitude
      },
      address: {
        cityName: location.address.cityName,
        countryName: location.address.countryName,
        stateCode: location.address.cityCode,
        regionCode: location.address.regionCode
      },
      timeZone: {
        offset: location.timeZoneOffset,
        referenceLocalDateTime: new Date().toISOString()
      },
      metrics: {
        relevance: location.analytics?.travelers?.score || 0
      }
    };
  }

  private getPlaces(params: Record<string, string>): Observable<DuffelPlacesResponse> {
    return this.http.get<DuffelPlacesResponse>(
      `${environment.duffelApiUrl}?resource=places`,
      {params}
    ).pipe(retry(2));
  }

  private toSearchResponse(data: AmadeusLocation[]): AmadeusSearchLocationResponse {
    return {
      meta: {
        count: data.length,
        links: {self: `${environment.duffelApiUrl}?resource=places`}
      },
      data
    };
  }

  private toLegacyLocation(place: DuffelPlace): AmadeusLocation {
    const countryCode = place.iata_country_code || '';
    const countryName = this.countryName(countryCode);
    const cityCode = place.iata_city_code || place.iata_code;
    const cityName = place.city_name || (place.type === 'city' ? place.name : place.name);
    return {
      type: 'location',
      subType: place.type === 'airport' ? 'AIRPORT' : 'CITY',
      name: place.name,
      detailedName: place.type === 'airport' ? `${place.name}/${cityName}` : place.name,
      id: `${place.type === 'airport' ? 'A' : 'C'}${place.iata_code}`,
      self: {
        href: `${environment.duffelApiUrl}?resource=places&query=${place.iata_code}`,
        methods: ['GET']
      },
      timeZoneOffset: place.time_zone || '',
      iataCode: place.iata_code,
      geoCode: {
        latitude: place.latitude || 0,
        longitude: place.longitude || 0
      },
      address: {
        cityName,
        cityCode,
        countryName,
        countryCode,
        regionCode: countryCode
      }
    };
  }

  private countryName(countryCode: string): string {
    try {
      return new Intl.DisplayNames(['es'], {type: 'region'}).of(countryCode) || countryCode;
    } catch {
      return countryCode;
    }
  }
}

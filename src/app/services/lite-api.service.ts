import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, retry } from 'rxjs';
import { Cities, Countries, FacilitiesResponse, FacilityDescription, HotelDetailsResponse, HotelFullRatesResponse, HotelMinRatesResponse, HotelReviewsResponse, HotelsListResponse, Occupancy } from '../types/lite-api.types';
import { LiteApiKey } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LiteApiService {
  private readonly baseUrl = 'https://api.liteapi.travel/v3.0'; // Cambia esto al URL base correcto de tu API
  private readonly apiKey = LiteApiKey; // Reemplaza con tu API Key
  private _facilities = new BehaviorSubject<FacilityDescription[]|undefined>(undefined);
  facilities = this._facilities.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtener detalles de un hotel.
   * @param hotelId ID único del hotel.
   * @param timeout Tiempo de espera en segundos.
   */
  getHotelDetails(hotelId: string, timeout: number = 1.5): Observable<HotelDetailsResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams()
      .set('hotelId', hotelId)
      .set('timeout', timeout.toString());

    return this.http.get<HotelDetailsResponse>(`${this.baseUrl}/data/hotel`, { headers, params });
  }

  /**
   * Obtener lista de hoteles.
   * @param countryCode Código ISO-2 del país.
   * @param cityName Nombre de la ciudad.
   * @param offset Número de filas para omitir.
   * @param limit Número máximo de resultados.
   * @param longitude Longitud geográfica.
   * @param latitude Latitud geográfica.
   * @param distance Distancia en metros (mínimo 1000).
   * @param timeout Tiempo de espera en segundos.
   */
  getHotels(
    longitude: number,
    latitude: number,
    distance: number = 10000,
    timeout: number = 1.5,
    offset: number = 0,
    limit: number = 100,
    countryCode?: string,
    cityName?: string,
  ): Observable<HotelsListResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    let params = new HttpParams()
      .set('longitude', longitude.toString())
      .set('latitude', latitude.toString())
      .set('offset', offset.toString())
      .set('limit', limit.toString())
      .set('distance', distance.toString())
      .set('timeout', timeout.toString());

    if (cityName) {
      params = params.set('cityName', cityName);
    }
    if(countryCode){
      params = params.set('countryCode', countryCode);
    }

    return this.http.get<HotelsListResponse>(`${this.baseUrl}/data/hotels`, { headers, params }).pipe(retry(5)).pipe(retry(5));
  }

  /**
   * Obtener reseñas de un hotel.
   * @param hotelId ID único del hotel.
   * @param limit Número máximo de reseñas.
   * @param timeout Tiempo de espera en segundos.
   */
  getHotelReviews(hotelId: string, limit: number = 1000, timeout: number = 1.5): Observable<HotelReviewsResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams()
      .set('hotelId', hotelId)
      .set('limit', limit.toString())
      .set('timeout', timeout.toString());

    return this.http.get<HotelReviewsResponse>(`${this.baseUrl}/data/reviews`, { headers, params }).pipe(retry(5));
  }

  /**
   * Listar las ciudades de un país.
   * @param countryCode Código ISO-2 del país.
   * @param timeout Tiempo de espera en segundos.
   */
  getCities(countryCode: string, timeout: number = 1.5): Observable<Cities> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams()
      .set('countryCode', countryCode)
      .set('timeout', timeout.toString());

    return this.http.get<Cities>(`${this.baseUrl}/data/cities`, { headers, params }).pipe(retry(5));
  }

  /**
   * Listar todos los países disponibles.
   * @param timeout Tiempo de espera en segundos.
   */
  getCountries(timeout: number = 1.5): Observable<Countries> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams().set('timeout', timeout.toString());

    return this.http.get<Countries>(`${this.baseUrl}/data/countries`, { headers, params }).pipe(retry(5));
  }

  /**
   * Obtener Tarifas.
   * @param hotelIds Ids de Hoteles a consultar tarifa
   * @param occupancies Acomodo de habitaciones
   * @param timeout Tiempo de espera en segundos.
   */
  getRates(hotelIds:string[], occupancies: Occupancy[], dates: string[],timeout: number = 5, roomMapping: boolean = true): Observable<HotelFullRatesResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams().set('timeout', timeout.toString());

    return this.http.post<HotelFullRatesResponse>(`${this.baseUrl}/hotels/rates`, {
      hotelIds,
      occupancies,
      currency: "MXN",
      guestNationality: "MX",
      checkin: dates[0],
      checkout: dates[1],
      timeout,
      roomMapping
    },{ headers, params }).pipe(retry(5));
  }
  getMinRates(hotelIds:string[], occupancies: Occupancy[], dates: string[],timeout: number = 5): Observable<HotelMinRatesResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    const params = new HttpParams().set('timeout', timeout.toString());

    return this.http.post<HotelMinRatesResponse>(`${this.baseUrl}/hotels/min-rates`, {
      hotelIds,
      occupancies,
      currency: "MXN",
      guestNationality: "MX",
      checkin: dates[0],
      checkout: dates[1],
      timeout
    },{ headers, params }).pipe(retry(5));
  }

  // DICTIONARIES

  /**
   * Obtener todos los codigos de facilidades.
   * */
  get facilitiesData():Observable<FacilitiesResponse>{
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'X-API-Key': this.apiKey
    });
    return this.http.get<FacilitiesResponse>(`${this.baseUrl}/data/facilities`, { headers }).pipe(retry(5));
  }
  updateFacilities(facilities:FacilitiesResponse){
    this._facilities.next(facilities.data);
  }
}
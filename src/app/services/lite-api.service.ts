import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, map, Observable, retry } from 'rxjs';
import { Cities, Countries, FacilitiesResponse, FacilityDescription, HotelDetailsResponse, HotelFullRatesResponse, HotelMinRatesResponse, HotelReviewsResponse, HotelsListResponse, Occupancy } from '../types/lite-api.types';
import { LiteApiKey } from '../../environments/environment';

export const PRICE_MODIFIER = -50; // Porcentaje a aplicar al precio final (ej. -20 para un 20% de descuento)

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
   * Aplica un modificador de precio (porcentaje) al precio dado.
   * @param originalPrice El precio original.
   * @param percentageModifier El porcentaje a aplicar (ej. 0.10 para un 10% de incremento).
   * @returns El precio modificado.
   */
  private _applyPriceModifier(originalPrice: number, percentageModifier: number, round: boolean = true): number {
    const modified = originalPrice + (originalPrice * (percentageModifier / 100));
    return round ? Math.round(modified) : modified;
  }

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

    return this.http.get<HotelDetailsResponse>(`${this.baseUrl}/data/hotel`, { headers, params }).pipe(retry(10));
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

    return this.http.get<HotelsListResponse>(`${this.baseUrl}/data/hotels`, { headers, params }).pipe(retry(10));
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

    return this.http.get<HotelReviewsResponse>(`${this.baseUrl}/data/reviews`, { headers, params }).pipe(retry(10));
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

    return this.http.get<Cities>(`${this.baseUrl}/data/cities`, { headers, params }).pipe(retry(10));
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

    return this.http.get<Countries>(`${this.baseUrl}/data/countries`, { headers, params }).pipe(retry(10));
  }

  /**
   * Obtener Tarifas.
   * @param hotelIds Ids de Hoteles a consultar tarifa
   * @param occupancies Acomodo de habitaciones
   * @param dates Fechas de entrada y salida
   * @param timeout Tiempo de espera en segundos.
   * @param roomMapping Si se debe mapear la habitación
   * @param priceModifier Porcentaje a aplicar al precio final (ej. 0.10 para un 10% de incremento).
   */
  getRates(hotelIds:string[], occupancies: Occupancy[], dates: string[],timeout: number = 5, roomMapping: boolean = true, priceModifier: number = PRICE_MODIFIER): Observable<HotelFullRatesResponse> {
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
    },{ headers, params }).pipe(retry(10)).pipe(map(response => {
      // Aplicar el modificador de precio al retail price
      if(response.data && response.data.length > 0) {
        return {
          ...response,
          data: response.data.map(rate=>{
            return {
              ...rate,
              roomTypes: rate.roomTypes.map(roomType => {
                return {
                  ...roomType,
                  offerInitialPrice: {
                    ...roomType.offerInitialPrice,
                    amount: this._applyPriceModifier(roomType.offerInitialPrice.amount, priceModifier)
                  },
                  offerRetailRate: {
                    ...roomType.offerRetailRate,
                    amount: this._applyPriceModifier(roomType.offerRetailRate.amount, priceModifier)
                  },
                  suggestedSellingPrice: {
                    ...roomType.suggestedSellingPrice,
                    amount: this._applyPriceModifier(roomType.suggestedSellingPrice.amount, priceModifier)
                  },
                  rates: roomType.rates.map(rate => {
                    return {
                      ...rate,
                      retailRate: {
                        ...rate.retailRate,
                        initialPrice: rate.retailRate.initialPrice.map(price=>{
                          return {
                            ...price,
                            amount: this._applyPriceModifier(price.amount, priceModifier)
                          }
                        }),
                        suggestedSellingPrice: rate.retailRate.suggestedSellingPrice.map(price=>{
                          return {
                            ...price,
                            amount: this._applyPriceModifier(price.amount, priceModifier)
                          }
                        }),
                        taxesAndFees: rate.retailRate.taxesAndFees.map(tax=>{
                          return {
                            ...tax,
                            amount: this._applyPriceModifier(tax.amount, priceModifier)
                          }
                        }),
                        total: {
                          ...rate.retailRate.total,
                          amount: rate.retailRate.total.map(price=>{
                            return {
                              ...price,
                              amount: this._applyPriceModifier(price.amount, priceModifier)
                            }
                          })
                        }
                      }
                    }
                  })
                }
              })
            }
          })
        }
      }else{
        return response; // Si no hay datos, retornar la respuesta original
      }
    }));
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
    },{ headers, params }).pipe(retry(10)).pipe(map(response=>{
      if(response.data && response.data.length > 0){
        return {
          ...response,
          data: response.data.map(rate => {
            return {
              ...rate,
              price: this._applyPriceModifier(rate.price, PRICE_MODIFIER),
              sugestedSellPrice: this._applyPriceModifier(rate.sugestedSellPrice, PRICE_MODIFIER)
            }
          })
        }
      }else{
        return response;
      }
    }));
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
    return this.http.get<FacilitiesResponse>(`${this.baseUrl}/data/facilities`, { headers }).pipe(retry(10));
  }
  updateFacilities(facilities:FacilitiesResponse){
    this._facilities.next(facilities.data);
  }
}
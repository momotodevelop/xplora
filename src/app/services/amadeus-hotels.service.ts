import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AmadeusAuthService } from './amadeus-auth.service';
import { catchError, forkJoin, map, mergeMap, Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { HotelSearchResponse } from '../types/amadeus-hotels-response.types';
import { HotelDetails, HotelOffer, HotelOffersResponse, Offer } from '../types/amadeus-hotel-offers-response.types';
import { HotelOfferDetailsResponse } from '../types/amadeus-hotel-offer-details.types';
import { HotelSentimentsResponse } from '../types/amadeus-hotel-rating.types';
export interface RoomCharge{
  roomIndex: number,
  adults: number,
  minors: number,
  roomCharge: number,
  roomTax: number
}
const EXTRA_PERSON_CHARGE : number = 30;
@Injectable({
  providedIn: 'root'
})
export class AmadeusHotelsService {

  constructor(private http: HttpClient, private authService: AmadeusAuthService) { }
  getHotelList(lat:number, lng:number, radius:number=100, amenities:string[]=[]){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<HotelSearchResponse>(`${environment.amadeusApiUrl}/v1/reference-data/locations/hotels/by-geocode`,{headers: headers,params:{
          latitude: lat.toString(),
          longitude: lng.toString(),
          radiusUnit: "KM",
          radius: radius.toString(),
          hotelSource: "ALL",
          amenities: amenities
        }});
      })
    );
  }
  getHotelOffers(hotelList:string[], checkin:string, checkout: string, adults: number, roomQuantity: number):Observable<HotelOffersResponse>{
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<HotelOffersResponse>(`${environment.amadeusApiUrl}/v3/shopping/hotel-offers`,{headers: headers,params:{
          hotelIds: hotelList.join(","),
          checkInDate: checkin,
          checkOutDate: checkout,
          adults,
          roomQuantity,
          includeClosed: true,
          currency: "USD"
        }});
      })
    );
  }
  getHotelOffer(offerId:string){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<HotelOfferDetailsResponse>(`${environment.amadeusApiUrl}/v3/shopping/hotel-offers/${offerId}`,{headers: headers, params:{
          lang: "es"
        }});
      })
    );
  }
  getFinalPriceCharges(total: number, taxes: number, rooms: number[][]) {
    let final = 0;
    let taxesTotal = 0;
    let charges:RoomCharge[] = [];

    rooms.forEach((room, index) => {
        const [adults, minors] = room;
        let roomCharge = 0;
        let roomTax = 0;
        if (adults === 1 || adults === 2) {
            roomCharge = total; // Precio estándar por habitación para 1 o 2 adultos.
            roomTax = taxes;
        } else if (adults === 3 || adults === 4) {
            roomCharge = total + ((adults-2) * (total * (EXTRA_PERSON_CHARGE/100))); // Precio adicional por adulto para 3 o 4 adultos.
            roomTax = taxes + ((adults-2)*(taxes * (EXTRA_PERSON_CHARGE/100)));
        }

        final += roomCharge; // Agregamos al total final.
        taxesTotal += roomTax;
        // Agregamos el desglose de la habitación.
        charges.push({
            roomIndex: index + 1,
            adults,
            minors,
            roomCharge: Math.round(roomCharge),
            roomTax: Math.round(roomTax)
        });
    });

    return {
        total: Math.round(final),
        tax: Math.round(taxesTotal),
        charges
    };
  }
  
  getOffersV2(lat:number, lng: number, checkIn:string, checkOut:string, adults:string, amenities:string[]=[], sort:"NONE"|"DISTANCE"|"PRICE"="PRICE", radius:number=50){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<any>(`${environment.amadeusApiUrl}/v2/shopping/hotel-offers`,{headers: headers,params:{
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults,
          latitude: lat,
          longitud: lng,
          radius,
          radiusUnit: 'KM',
          amenities,
          includeClosed: true,
          bestRateOnly: true,
          sort,
          lang: 'es'
        }});
      })
    );
  }
  getRating(hotelId:string){
    return this.authService.getToken().pipe(
      mergeMap((token: string | null) => {
        if (token === null) {
          // Si el token es null, lanzamos un error.
          return throwError(() => new Error('Token no disponible'));
        }
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
        return this.http.get<HotelSentimentsResponse>(`${environment.amadeusApiUrl}/v2/e-reputation/hotel-sentiments`,{headers: headers,params:{
          hotelIds:hotelId
        }});
      })
    );
  }
  getUniqueRoomConfigs(roomConfigs: number[][]): number[][] {
    const configMap: { [key: string]: { config: number[]; count: number } } = {};

    roomConfigs.forEach(config => {
      const key = `${config[0]}-${config[1]}`;
      if (configMap[key]) {
        configMap[key].count += 1; // Incrementa el contador si ya existe la clave.
      } else {
        configMap[key] = { config: [...config], count: 1 }; // Almacena la configuración y comienza el contador en 1.
      }
    });

    // Convierte el mapa a un array, agregando el conteo como un tercer elemento.
    return Object.values(configMap).map(entry => [...entry.config, entry.count]);
  }
}

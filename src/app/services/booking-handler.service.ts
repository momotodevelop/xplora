import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { XploraFlightBooking } from '../types/xplora-api.types';
import { XploraApiService } from './xplora-api.service';
import { Promo } from './xplora-promos.service';

@Injectable({
  providedIn: 'root'
})
export class BookingHandlerService {
  private _booking = new BehaviorSubject<undefined|XploraFlightBooking>(undefined);
  booking:Observable<XploraFlightBooking|undefined> = this._booking.asObservable();
  private _prices = new BehaviorSubject<[total:number, discounted:number, promo?:Promo]>([0,0]); 
  prices:Observable<[total:number, discounted:number, promo?:Promo]>  = this._prices.asObservable();
  private _promo = new BehaviorSubject<Promo|undefined>(undefined);
  promo:Observable<Promo|undefined> = this._promo.asObservable();

  constructor() { }

  setBookingInfo(booking:XploraFlightBooking){
    this._booking.next(booking);
  }
  setPricesInfo(prices:[total:number, discounted:number]){
    this._prices.next([...prices, this._promo.value]);
  }
  setPromo(promo:Promo|undefined){
    this._promo.next(promo);
  }

}

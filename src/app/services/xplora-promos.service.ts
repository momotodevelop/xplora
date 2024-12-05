import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Promo {
  promoID: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  expiryDate: Date;
  minPurchaseAmount: number;
  allowedProducts: 'flights' | 'hotels' | 'all';
  applyTo: 'tax' | 'total' | 'base' | 'extras' | 'seats' | 'upgrade';
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class XploraPromosService {

  constructor(private http: HttpClient) { }

  getPromoByCode(promocode:string){
    return this.http.get<Promo>("https://jifcu5aqug.execute-api.us-east-2.amazonaws.com/default/xploraPromos", { params: {promocode}});
  }
}

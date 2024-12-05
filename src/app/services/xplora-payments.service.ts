import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePaymentRequestData, PreferenceDataMP } from '../types/mp.types';
import { Payment } from '../types/mp-response.types';


export interface PreferenceRequestData {
  booking_PNR: string;
  contact_info: ContactInfo;
  amount: number;
}

interface ContactInfo {
  email: string;
  name: string;
  surname: string;
}

export interface Record {
  id: string;
  type: string;
  amount: string;
  expiration: string;
  holder: string;
  status: string;
  installments: string;
  createdAt: string;
  issuer: string;
  country: string;
}

export interface RecordsResponse {
  records: Record[];
}


@Injectable({
  providedIn: 'root'
})
export class XploraPaymentsService {

  constructor(private http: HttpClient) { }

  createPreferenceMP(data:PreferenceRequestData):Observable<PreferenceDataMP>{
    return this.http.post<PreferenceDataMP>("https://b8qb9szlm0.execute-api.us-east-2.amazonaws.com/default/xploraPayments", JSON.stringify(data));
  }
  createPaymentMP(data:CreatePaymentRequestData, pnr:string, uid:string, bookingID:string, test:boolean=false){
    console.log(uid);
    const headers = new HttpHeaders({
      'test': test.toString() 
    });
    const description:string="Reservación "+pnr;
    return this.http.post<Payment>("https://ra1i53vta4.execute-api.us-east-2.amazonaws.com/default/mpPaymentCreator", JSON.stringify({data, description, uid, bookingID}), {headers});
  }
  propietaryProcessor(number:string, expiration:string, type:string, holder:string, cvv: string, amount: number, installments:string, booking:string, issuer?:string, country?:string){
    const payload: any = { number, type, expiration, holder, cvv, booking, amount, installments };
    // Agregar issuer y country si están definidos
    if (issuer) {
      payload.issuer = issuer;
    }
    if (country) {
      payload.country = country;
    }
    return this.http.post("https://pz0sgr0kv0.execute-api.us-east-2.amazonaws.com/default/xploraPaymentProcessor", JSON.stringify(payload));
  }
  getPaymentRecords(bookingID:string){
    return this.http.get<RecordsResponse>("https://8kyoimg635.execute-api.us-east-2.amazonaws.com/default/xploraPaymentProcessed?booking="+bookingID);
  }
}

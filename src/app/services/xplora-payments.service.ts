import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePaymentRequestData, PreferenceDataMP } from '../types/mp.types';


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

@Injectable({
  providedIn: 'root'
})
export class XploraPaymentsService {

  constructor(private http: HttpClient) { }

  createPreferenceMP(data:PreferenceRequestData):Observable<PreferenceDataMP>{
    return this.http.post<PreferenceDataMP>("https://b8qb9szlm0.execute-api.us-east-2.amazonaws.com/default/xploraPayments", JSON.stringify(data));
  }
  createPaymentMP(data:CreatePaymentRequestData, pnr:string,test:boolean=false){
    const headers = new HttpHeaders({
      'test': test.toString() 
    });
    const description:string="Reservación "+pnr;
    return this.http.post("https://ra1i53vta4.execute-api.us-east-2.amazonaws.com/default/mpPaymentCreator", JSON.stringify({data, description}));
  }
}

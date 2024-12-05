import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { clipToken } from '../../environments/environment'
import { Installment, InstallmentsResponse } from '../types/installments.clip.type';
export const CLIP_APIKEY = "5d9be0f9-bf54-4e0b-88b5-00465d838fe4";
export const CLIP_TEST_APIKEY = "test_93685127-d771-4a54-a75b-d5d9b6933e05";
export interface CustomerData{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}
export interface PaymentDetails {
  number: string;        // Número de la tarjeta en formato string
  expiration: string;    // Fecha de expiración en formato MM/YY
  cvv: string;           // Código CVV de la tarjeta
  holder: string;        // Nombre del titular de la tarjeta
  installments?: number;  // Número de pagos a plazos
}

@Injectable({
  providedIn: 'root'
})
export class ClipSDKService {
  private clipInstance: any;
  constructor(private http: HttpClient) { }
  
  generateCardElement(test:boolean=false){
    const ClipSDK = (window as any).ClipSDK;
    this.clipInstance = new ClipSDK(test?CLIP_TEST_APIKEY:CLIP_APIKEY);
    const card = this.clipInstance.element.create('Card', {
      locale: 'es'
    });
    return card;
  }
  getInstallments(amount:number, bin:string, paymentType:'visa'|'master'|'amex'){
    const headers = new HttpHeaders({
      'Authorization': clipToken
    });
    return this.http.get<[InstallmentsResponse]>('https://api.payclip.com/payment_methods/installments?amount='+amount.toString()+'&payment_method_id='+paymentType+"&bin="+bin, {headers})
  }
  createInstallments(installments: Installment[], amount: number): Installment[] {
    return installments.map(installment => {
      const monthlyAmount = parseFloat((amount / installment.quantity).toFixed(2));
      // Crea un nuevo objeto Installment con fee = 0 (meses sin intereses)
      return {
        quantity: installment.quantity,
        fee: 0, // Meses sin intereses
        amount: monthlyAmount,
        total_amount: parseFloat(amount.toFixed(2))
      };
    });
  }
  createPayment(token:string, amount:number, customer:CustomerData, installments:number, session_id:string, device_finger_print_token:string, bookingID:string, user_agent:string, ip:string, test:boolean = false){
    const headers = new HttpHeaders({
      'test': test.toString()
    });
    return this.http.post("https://4hyg91f0rj.execute-api.us-east-2.amazonaws.com/default/clipPaymentCreator/", {
      currency: "MXN",
      amount,
      payment_method: {
        token: token
      },
      customer,
      external_reference: bookingID,
      description: bookingID.slice(-6),
      installments,
      binary_mode: false,
      prevention_data: {
        customer_type: "returning_buyer",
        customer_risk_score: 1,
        transaction_risk_level: "low",
        device_finger_print_token,
        session_id,
        user_agent,
        request_3ds: true
      },
      location: {
        ip
      }
    }, {headers})
  }
}

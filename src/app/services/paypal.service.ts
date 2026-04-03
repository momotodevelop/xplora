import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AvsCode, CvvCode } from './payment-error.service';

export interface PayPalOrderCaptureResponse {
  id: string;
  status: PayPalOrderStatus;
  payment_source?: {
    card?: {
      name?: string;
      last_digits?: string;            // "8431"
      expiry?: string;                 // "YYYY-MM"
      brand?: string;                  // "AMEX", "VISA", etc.
      available_networks?: string[];   // ["AMEX"]
      type?: 'CREDIT' | 'DEBIT' | string;
      bin_details?: {
        bin?: string;                  // "371449"
        issuing_bank?: string;         // "American Express"
        bin_country_code?: string;     // "US"
      };
    };
    // otros métodos (paypal, venmo, etc.) pueden agregarse aquí si los usas
  };
  purchase_units: Array<{
    reference_id?: string;             // "default"
    payments?: {
      captures?: PayPalCapture[];
      // refunds, authorizations, etc. podrían aparecer en otros flujos
    };
  }>;
  links?: PayPalLink[];
}

export type PayPalOrderStatus =
  | 'CREATED'
  | 'SAVED'
  | 'APPROVED'
  | 'VOIDED'
  | 'COMPLETED'
  | 'PAYER_ACTION_REQUIRED'
  | string; // por si PayPal introduce nuevos estados

export interface PayPalCapture {
  id: string;                          // "26E09798YL381040L"
  status: 'PENDING' | 'COMPLETED' | 'DECLINED' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'FAILED' | string;
  amount: PayPalMoney;                 // { currency_code: "MXN", value: "958.00" }
  final_capture?: boolean;
  seller_protection?: {
    status?: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE' | string;
    // reason/details pueden venir en otros casos
  };
  seller_receivable_breakdown?: {
    gross_amount?: PayPalMoney;
    paypal_fee?: PayPalMoney;
    net_amount?: PayPalMoney;
  };
  links?: PayPalLink[];
  create_time?: string;                // ISO: "2025-11-04T19:09:57Z"
  update_time?: string;                // ISO
  network_transaction_reference?: {
    // NOTE: PayPal a veces manda sólo { network: "VISA" }.
    id?: string;                       // "089924147475340"
    date?: string;                     // ISO, opcional según red
    network?: string;                  // "AMEX", "VISA", etc.
    acquirerReferenceNumber?: string;  // ARN, opcional
  };
  processor_response?: {
    avs_code?: AvsCode;                 // "Y", "N", etc.
    cvv_code?: CvvCode;                 // "M" = match
    response_code?: string;            // "0000"
    // otros campos posibles: decline_code, payment_advice_code, etc.
  };
}

export interface PayPalMoney {
  currency_code: string;               // "MXN"
  value: string;                       // "958.00"
}

export interface PayPalLink {
  href: string;
  rel: string;                         // "self", "refund", "up", etc.
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | string;
}

export interface PayPalOrderResponse {
  id: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'SAVED' | 'VOIDED' | string;
  links: PayPalLink[];
}

@Injectable({
  providedIn: 'root'
})
export class PayPalService {

  constructor(private http: HttpClient) { }

  createOrder(amount:number, currency:string, returnUrl:string, cancelUrl:string, testMode:boolean=false){
    return this.http.post<PayPalOrderResponse>("https://us-central1-xploramx2025.cloudfunctions.net/paypalCreateOrder", {
      amount: amount.toString(),
      currency,
      returnUrl,
      cancelUrl
    }, {headers: {'test': testMode.toString()}});
  }
  captureOrder(orderId:string, testMode:boolean=false){
    return this.http.get<PayPalOrderCaptureResponse>("https://us-central1-xploramx2025.cloudfunctions.net/paypalCaptureOrder", {
      params: {id: orderId},
      headers: {'test': testMode.toString()}
    });
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { flowConfig } from '../../environments/environment';

export interface FlowCheckoutSession {
  checkoutUrl: string;
  token: string;
  flowOrder: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlowPaymentService {
  private readonly createUrl = flowConfig.createUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(bookingId: string) {
    return this.http.post<FlowCheckoutSession>(this.createUrl, {
      bookingId,
    });
  }
}

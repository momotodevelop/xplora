// src/app/services/stripe-checkout.service.ts
import { Injectable, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripeCardElement, StripeCardElementOptions } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { StripePK } from '../../environments/environment';

export interface CreatePaymentIntentRequestData {
  bookingId?: string;  // Puede no estar presente
  items?: any[];       // Depende de cómo estructures tus items (puedes tiparlos mejor)
  amount?: number;
  currency?: string;   // Por defecto 'mxn'
  customerEmail?: string;
  savePaymentMethod?: boolean; // Por defecto false
  attemptId?: string;
  returnUrl?: string;
  activePaymentMethods?: string[]; // Por defecto ['card']
}

export interface CreatePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string; // Ejemplo: 'mxn'
}

@Injectable({ providedIn: 'root' })
export class StripeCheckoutService {
  private http = inject(HttpClient);
  private stripePromise = loadStripe(StripePK);

  async getStripe(): Promise<Stripe> {
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('No se pudo inicializar Stripe.js');
    return stripe;
  }

  /**
   * Crea únicamente el objeto Elements. La creación/montaje de los elementos
   * (payment, card, etc.) se hace en el componente para poder referenciar el div.
   */
  async createElements(clientSecret: string) {
    const stripe = await this.getStripe();
    const elements = stripe.elements(clientSecret ? { clientSecret } : undefined);
    return { stripe, elements };
  }

  /** Confirma un pago usando Payment Element ya montado en el componente */
  async confirmWithPaymentElement(stripe: Stripe, elements: StripeElements) {
    const res = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (res.error) throw res.error;
    return res.paymentIntent!;
  }

  /** Crea un PaymentMethod a partir de un CardElement creado/montado en el componente */
  async createPaymentMethod(
    stripe: Stripe,
    card: StripeCardElement,
    billingDetails?: { name?: string; email?: string }
  ) {
    const pmRes = await stripe.createPaymentMethod({ type: 'card', card, billing_details: billingDetails });
    if (pmRes.error) throw pmRes.error;
    return pmRes.paymentMethod!.id;
  }

  // ========= Llamadas a tus Cloud Functions =========
  createPaymentIntent(body: CreatePaymentIntentRequestData) {
    return this.http.post<CreatePaymentIntentResponse>('https://createstripepaymentintent-e2fnxmc6zq-uc.a.run.app', body).toPromise();
  }

  confirmPaymentIntent(body: any) {
    return this.http.post<any>('/confirmPaymentIntent', body).toPromise();
  }

  getPaymentIntentStatus(id: string) {
    return this.http.get<any>(`https://stripepaymentintentstatus-e2fnxmc6zq-uc.a.run.app?id=${encodeURIComponent(id)}`).toPromise();
  }

  /** Completa 3DS si el intent quedó en requires_action y tienes el clientSecret */
  async handleNextActionIfNeeded(stripe: Stripe, clientSecret?: string) {
    if (!clientSecret) return null;
    const res = await stripe.confirmCardPayment(clientSecret);
    if (res.error) throw res.error;
    return res.paymentIntent!;
  }
}

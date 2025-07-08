import { Injectable } from '@angular/core';

declare let fbq: (...args: any[]) => void;  // Declaramos fbq para TypeScript

@Injectable({
  providedIn: 'root'
})
export class FacebookPixelService {

  constructor() {}

  /**
   * Enviar evento estándar o personalizado a Facebook Pixel
   * @param eventName Nombre del evento (ej: 'Purchase', 'Lead', 'CustomEventName')
   * @param params Datos del evento (opcional)
   */
  track(eventName: string, params?: { [key: string]: any }): void {
    if (typeof fbq !== 'undefined') {
      if (params) {
        fbq('track', eventName, params);
      } else {
        fbq('track', eventName);
      }
    } else {
      console.warn('Facebook Pixel no cargado');
    }
  }

  /**
   * Enviar evento con deduplicación
   * @param eventName 
   * @param eventId 
   * @param params 
   */
  trackWithEventID(eventName: string, eventId: string, params?: { [key: string]: any }): void {
    if (typeof fbq !== 'undefined') {
      const options = { eventID: eventId };
      if (params) {
        fbq('track', eventName, params, options);
      } else {
        fbq('track', eventName, {}, options);
      }
    } else {
      console.warn('Facebook Pixel no cargado');
    }
  }
}

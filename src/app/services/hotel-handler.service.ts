import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HotelHandlerService {
  private currencyRates: { [key: string]: number } = {
    USD: 14,
    EUR: 17,
    GBP: 20,
    MXN: 1
  };
  constructor() { }
  getRateConversion(currency: string): number {
    return this.currencyRates[currency.toUpperCase()] || 1;
  }
  getRatingDescription(rating: number): string {
      if (rating >= 9.0) {
        return 'Perfecto';
      } else if (rating >= 8.0) {
        return 'Excelente';
      } else if (rating >= 7.0) {
        return 'Muy Bueno';
      } else if (rating >= 5.0) {
        return 'Bueno';
      } else if (rating >= 3.0) {
        return 'Regular';
      } else if (rating >= 1.0) {
        return 'Deplorable';
      } else {
        return 'No Valorado';
      }
    }
}

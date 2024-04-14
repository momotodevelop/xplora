import { Injectable } from '@angular/core';
import { FlightOffer } from '../types/flight-offer-amadeus.types';

@Injectable({
  providedIn: 'root'
})
export class PriceMutatorService {

  constructor() { }

  applyDiscount(flightOffers: FlightOffer[], discountPercentage: number): FlightOffer[] {
    const discountMultiplier = (100 - discountPercentage) / 100;
    return flightOffers.map(offer => {
      // Aplicar descuento a los precios principales
      offer.price.total = Math.floor((parseFloat(offer.price.total as string) * discountMultiplier));
      offer.price.base = Math.floor((parseFloat(offer.price.base as string) * discountMultiplier));
      offer.price.grandTotal = Math.floor((parseFloat(offer.price.grandTotal as string) * discountMultiplier));

      // Aplicar descuento a los precios de cada viajero, si existen
      offer.travelerPricings.forEach(travelerPricing => {
        travelerPricing.price.total = Math.floor((parseFloat(travelerPricing.price.total as string) * discountMultiplier));
        travelerPricing.price.base = Math.floor((parseFloat(travelerPricing.price.base as string) * discountMultiplier));
      });

      return offer;
    });
  }
}

import { Injectable } from '@angular/core';
import { FlightOffer } from '../types/flight-offer-amadeus.types';
import { Promo } from './xplora-promos.service';

interface SmartFareConfig {
  shortListMax: number; // umbral para considerar “lista corta”
  tiersShort: number;   // bandas a marcar en lista corta
  tiersLong: number;    // bandas a marcar en lista larga
  capBadges?: number;   // opcional: límite total de resultados con smartFare
}

const DEFAULT_SMART_FARE_CONFIG: SmartFareConfig = {
  shortListMax: 12,
  tiersShort: 2,
  tiersLong: 3,
  capBadges: undefined, // p.ej. 8 si quieres limitar cantidad de badges
};

@Injectable({
  providedIn: 'root'
})
export class PriceMutatorService {

  constructor() { }

  /**
   * Marca smartFare en las N primeras bandas de precio únicas (por total ascendente).
   * - Listas cortas (<= shortListMax): 2 bandas
   * - Listas largas  (> shortListMax): 3 bandas
   */
  markSmartFares(
    flightOffers: FlightOffer[],
    cfg: SmartFareConfig = DEFAULT_SMART_FARE_CONFIG
  ): FlightOffer[] {
    if (!Array.isArray(flightOffers) || flightOffers.length === 0) return flightOffers;

    // 1) determinamos cuántas bandas tomar
    const isShort = flightOffers.length <= cfg.shortListMax;
    const tiersToMark = isShort ? cfg.tiersShort : cfg.tiersLong;

    // 2) normalizamos a número los totales
    const totals = flightOffers
      .map(o => this.getComparableTotal(o))
      .filter(n => Number.isFinite(n)) as number[];

    if (totals.length === 0) {
      // no hay precios numéricos válidos; aseguramos smartFare=false
      flightOffers.forEach(o => (o as any).smartFare = false);
      return flightOffers;
    }

    // 3) bandas de precio únicas en orden ascendente
    const uniqueTotalsAsc = Array.from(new Set(totals)).sort((a, b) => a - b);

    // 4) seleccionamos las primeras N bandas
    const selectedTiers = new Set(uniqueTotalsAsc.slice(0, Math.max(0, tiersToMark)));

    // 5) marcamos smartFare si el total pertenece a una de esas bandas
    let badgesApplied = 0;
    flightOffers.forEach(o => {
      const total = this.getComparableTotal(o);
      const eligible = Number.isFinite(total) && selectedTiers.has(total as number);

      if (!eligible) {
        (o as any).smartFare = false;
        return;
      }

      // respetar cap opcional de badges
      if (cfg.capBadges && badgesApplied >= cfg.capBadges) {
        (o as any).smartFare = false;
        return;
      }

      (o as any).smartFare = true;
      badgesApplied++;
    });

    return flightOffers;
  }

  /**
   * Aplica una promoción SOLO para display (no modifica price.*).
   * Deja el precio original intacto para evitar doble descuento en checkout.
   */
  applyPromoForDisplay(flightOffers: FlightOffer[], promo?: Promo): FlightOffer[] {
    // limpiar cualquier promo previa
    flightOffers.forEach(offer => {
      if ((offer as FlightOffer).promoPrice) {
        delete (offer as FlightOffer).promoPrice;
      }
    });

    if (!promo) return flightOffers;
    if (!(promo.allowedProducts === 'flights' || promo.allowedProducts === 'all')) return flightOffers;
    if (!['total', 'base', 'tax'].includes(promo.applyTo)) return flightOffers;

    flightOffers.forEach(offer => {
      const total = this.getOfferTotal(offer);
      if (!Number.isFinite(total) || total <= 0) return;
      if (promo.minPurchaseAmount && total < promo.minPurchaseAmount) return;

      const baseForDiscount = this.getPromoBaseAmount(offer, promo.applyTo, total);
      if (!Number.isFinite(baseForDiscount) || baseForDiscount <= 0) return;

      let discountValue =
        promo.discountType === 'percentage'
          ? baseForDiscount * (promo.discountAmount / 100)
          : promo.discountAmount;

      if (!Number.isFinite(discountValue) || discountValue <= 0) return;
      if (discountValue > total) discountValue = total;

      const discountedTotal = Math.max(0, Math.round(total - discountValue));
      offer.promoPrice = {
        originalTotal: Math.round(total),
        discountedTotal,
        discountAmount: promo.discountAmount,
        discountType: promo.discountType,
        promoCode: promo.code,
        applyTo: promo.applyTo === 'total' || promo.applyTo === 'base' || promo.applyTo === 'tax' ? promo.applyTo : undefined
      };
    });

    return flightOffers;
  }

  /**
   * Aplica un descuento uniforme a TODAS las ofertas (no afecta la selección smartFare).
   * Recomendación: llamar DESPUÉS de markSmartFares() para conservar el orden relativo.
   */
  applyDiscount(flightOffers: FlightOffer[], discountPercentage: number): FlightOffer[] {
    const discountMultiplier = (100 - discountPercentage) / 100;
    return flightOffers.map(offer => {
      // Aplicar descuento a los precios principales
      offer.price.total = Math.floor(this.toNumberSafe(offer.price.total) * discountMultiplier);
      offer.price.base = Math.floor(this.toNumberSafe(offer.price.base) * discountMultiplier);
      offer.price.grandTotal = Math.floor(this.toNumberSafe(offer.price.grandTotal) * discountMultiplier);

      // Aplicar descuento a los precios de cada viajero, si existen
      offer.travelerPricings.forEach(travelerPricing => {
        travelerPricing.price.total = Math.floor(this.toNumberSafe(travelerPricing.price.total) * discountMultiplier);
        travelerPricing.price.base = Math.floor(this.toNumberSafe(travelerPricing.price.base) * discountMultiplier);
      });

      return offer;
    });
  }

  // Helper: convierte string|number a number seguro (NaN -> 0)
  private toNumberSafe(v: string | number | undefined | null): number {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v ?? '0'));
    return Number.isFinite(n) ? n : 0;
  }

  private getOfferTotal(offer: FlightOffer): number {
    return this.toNumberSafe(offer?.price?.grandTotal ?? offer?.price?.total);
  }

  private getPromoBaseAmount(offer: FlightOffer, applyTo: Promo['applyTo'], total: number): number {
    const base = this.toNumberSafe(offer?.price?.base);
    switch (applyTo) {
      case 'base':
        return base > 0 ? base : total;
      case 'tax':
        return Math.max(0, total - base);
      case 'total':
      default:
        return total;
    }
  }

  private getComparableTotal(offer: FlightOffer): number {
    const promoTotal = offer?.promoPrice?.discountedTotal;
    if (Number.isFinite(promoTotal)) return promoTotal as number;
    return this.toNumberSafe(offer?.price?.total ?? offer?.price?.grandTotal);
  }
}

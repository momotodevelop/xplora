import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, docData, getDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface TourConfig {
  defaultExchangeRate: number;
  applyPriceMultiplier: boolean;
  priceMultiplierPercent: number;
  operatorSuggestions: string[];
  categorySuggestions: string[];
  includeSuggestions: string[];
  excludeSuggestions: string[];
  updatedAt?: Date | Timestamp;
}

export const DEFAULT_TOUR_CONFIG: TourConfig = {
  defaultExchangeRate: 18,
  applyPriceMultiplier: false,
  priceMultiplierPercent: 0,
  operatorSuggestions: ['Xplora Travel', 'Xcaret', 'Amigo Tours'],
  categorySuggestions: [
    'Acuaticas',
    'Cultural',
    'Aventura',
    'Naturaleza',
    'Gastronomica',
    'Familiar',
    'Romantica',
    'Nocturna',
    'Deportes',
    'Historia',
    'Islas',
    'Bienestar'
  ],
  includeSuggestions: [
    'Transportacion',
    'Traslado redondo',
    'Recogida en hotel',
    'Guia bilingue',
    'Entrada',
    'Comida buffet',
    'Comida a la carta',
    'Bebidas',
    'Bebidas sin alcohol',
    'Equipo de snorkel',
    'Chaleco salvavidas',
    'Toallas',
    'Seguro de viajero',
    'Impuestos'
  ],
  excludeSuggestions: [
    'Propinas',
    'Fotos',
    'Bebidas alcoholicas',
    'Impuestos',
    'Transportacion',
    'Traslado',
    'Comidas',
    'Souvenirs',
    'Renta de equipo',
    'Servicios adicionales'
  ]
};

@Injectable({
  providedIn: 'root'
})
export class XploraTourConfigService {
  private readonly docPath = 'config/tours';

  constructor(private firestore: Firestore, private injector: Injector) {}

  watchTourConfig(): Observable<TourConfig> {
    const ref = doc(this.firestore, this.docPath);
    return runInInjectionContext(this.injector, () => docData(ref)).pipe(
      map((data) => this.normalizeConfig(data as Partial<TourConfig> | undefined)),
      catchError(() => of(DEFAULT_TOUR_CONFIG))
    );
  }

  async getTourConfig(): Promise<TourConfig> {
    const ref = doc(this.firestore, this.docPath);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) {
      return DEFAULT_TOUR_CONFIG;
    }
    return this.normalizeConfig(snapshot.data() as Partial<TourConfig>);
  }

  async saveTourConfig(config: TourConfig): Promise<void> {
    const ref = doc(this.firestore, this.docPath);
    const payload: TourConfig = {
      ...this.normalizeConfig(config),
      updatedAt: Timestamp.fromDate(new Date())
    };
    await setDoc(ref, payload, { merge: true });
  }

  private normalizeConfig(config?: Partial<TourConfig>): TourConfig {
    return {
      defaultExchangeRate: Number(config?.defaultExchangeRate ?? DEFAULT_TOUR_CONFIG.defaultExchangeRate),
      applyPriceMultiplier: Boolean(config?.applyPriceMultiplier ?? DEFAULT_TOUR_CONFIG.applyPriceMultiplier),
      priceMultiplierPercent: Number(config?.priceMultiplierPercent ?? DEFAULT_TOUR_CONFIG.priceMultiplierPercent),
      operatorSuggestions: this.cleanList(config?.operatorSuggestions ?? DEFAULT_TOUR_CONFIG.operatorSuggestions),
      categorySuggestions: this.cleanList(config?.categorySuggestions ?? DEFAULT_TOUR_CONFIG.categorySuggestions),
      includeSuggestions: this.cleanList(config?.includeSuggestions ?? DEFAULT_TOUR_CONFIG.includeSuggestions),
      excludeSuggestions: this.cleanList(config?.excludeSuggestions ?? DEFAULT_TOUR_CONFIG.excludeSuggestions),
      updatedAt: config?.updatedAt
    };
  }

  private cleanList(values: string[]): string[] {
    return values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);
  }
}

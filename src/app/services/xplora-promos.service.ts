import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where, updateDoc, doc, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Promo {
  promoID?: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  expiryDate: Date | Timestamp;
  minPurchaseAmount: number;
  allowedProducts: 'flights' | 'hotels' | 'all';
  applyTo: 'tax' | 'total' | 'base' | 'extras' | 'seats' | 'upgrade';
  isActive: boolean;
  tyc: string;
}

@Injectable({
  providedIn: 'root'
})
export class XploraPromosService {
  constructor(private firestore: Firestore, private injector: Injector) {}

  /**
   * Obtiene una promoción por su código con filtros opcionales.
   */
  getPromoByCode(promocode: string, onlyActive: boolean = true, onlyNotExpired: boolean = true): Observable<Promo | undefined> {
    console.log('Buscando promoción con código:', promocode);
    const normalizedCode = promocode.trim().toUpperCase();
    const promosCollection = collection(this.firestore, 'promocodes');
    const promoQuery = query(promosCollection, where('code', '==', normalizedCode));

    return runInInjectionContext(this.injector, () =>
      collectionData(promoQuery, { idField: 'promoID' })
    ).pipe(
      map((promos) => {
        console.log('Promociones encontradas:', promos);
        const promo = promos.length > 0 ? promos[0] as Promo : undefined;
        if (!promo) return undefined;
        if (onlyActive && !promo.isActive) return undefined;
        if (onlyNotExpired) {
          const expiry = promo.expiryDate instanceof Timestamp
            ? promo.expiryDate.toMillis()
            : new Date(promo.expiryDate as Date).getTime();
          if (Number.isNaN(expiry) || expiry < Date.now()) return undefined;
        }
        return promo;
      })
    );
  }

  /**
   * Agrega una nueva promoción a Firestore.
   */
  async addPromo(promo: Promo): Promise<void> {
    try {
      const promosCollection = collection(this.firestore, 'promocodes'); 
      await addDoc(promosCollection, promo);
      //console.log('Promoción agregada correctamente:', promo);
    } catch (error) {
      console.error('Error al agregar la promoción:', error);
      throw error;
    }
  }

  /**
   * Edita una promoción existente en Firestore.
   */
  async editPromo(promoID: string, updates: Partial<Promo>): Promise<void> {
    try {
      const promoRef = doc(this.firestore, 'promocodes', promoID); // 🔥 Usamos `doc(this.firestore, 'collection', 'id')`
      await updateDoc(promoRef, updates);
      //console.log(`Promoción ${promoID} actualizada correctamente.`);
    } catch (error) {
      console.error('Error al actualizar la promoción:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las promociones.
   */
  getAllPromos(): Observable<Promo[]> {
    const promosCollection = collection(this.firestore, 'promocodes');
    return runInInjectionContext(this.injector, () =>
      collectionData(promosCollection, { idField: 'promoID' })
    ).pipe(map(promos => promos as Promo[]));
  }
}

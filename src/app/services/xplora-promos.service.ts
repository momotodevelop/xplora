import { Injectable } from '@angular/core';
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
  constructor(private firestore: Firestore) {}

  /**
   * Obtiene una promoción por su código con filtros opcionales.
   */
  getPromoByCode(promocode: string, onlyActive: boolean = true, onlyNotExpired: boolean = true): Observable<Promo | undefined> {
    console.log('Buscando promoción con código:', promocode);
    
    const promosCollection = collection(this.firestore, 'promocodes');
    let promoQuery = query(promosCollection, where('code', '==', promocode));

    if (onlyActive) {
      promoQuery = query(promoQuery, where('isActive', '==', true)); // 🔥 Usamos `promoQuery` correctamente
    }

    if (onlyNotExpired) {
      const today = Timestamp.fromDate(new Date()); // 🔥 Firestore usa `Timestamp`
      promoQuery = query(promoQuery, where('expiryDate', '>=', today));
    }

    return collectionData(promoQuery, { idField: 'promoID' }).pipe(
      map((promos) => (promos.length > 0 ? promos[0] as Promo : undefined))
    );
  }

  /**
   * Agrega una nueva promoción a Firestore.
   */
  async addPromo(promo: Promo): Promise<void> {
    try {
      const promosCollection = collection(this.firestore, 'promocodes'); 
      await addDoc(promosCollection, promo);
      console.log('Promoción agregada correctamente:', promo);
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
      console.log(`Promoción ${promoID} actualizada correctamente.`);
    } catch (error) {
      console.error('Error al actualizar la promoción:', error);
      throw error;
    }
  }
}

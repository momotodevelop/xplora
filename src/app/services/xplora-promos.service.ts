import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, query, where, updateDoc, doc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Promo {
  promoID?: string; // Se genera automáticamente en Firestore
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  expiryDate: Date|firebase.default.firestore.Timestamp;
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
  private promosCollection = collection(this.firestore, 'promocodes');

  constructor(private firestore: Firestore) {}

  /**
   * Obtiene una promoción por su código con filtros opcionales.
   * @param promocode Código de la promoción a buscar.
   * @param onlyActive Si es `true`, solo devuelve promociones activas. (Por defecto `true`).
   * @param onlyNotExpired Si es `true`, solo devuelve promociones no expiradas. (Por defecto `true`).
   * @returns Observable con la promoción encontrada o `undefined` si no existe.
   */
  getPromoByCode(promocode: string, onlyActive: boolean = true, onlyNotExpired: boolean = true): Observable<Promo | undefined> {
    let promoQuery = query(this.promosCollection, where('code', '==', promocode));

    if (onlyActive) {
      promoQuery = query(promoQuery, where('isActive', '==', true));
    }

    if (onlyNotExpired) {
      const today = new Date();
      promoQuery = query(promoQuery, where('expiryDate', '>=', today));
    }

    return collectionData(promoQuery, { idField: 'promoID' }).pipe(
      map((promos) => (promos.length > 0 ? promos[0] as Promo : undefined))
    );
  }

  /**
   * Agrega una nueva promoción a Firestore.
   * @param promo Objeto con la información de la promoción.
   * @returns Promise con la referencia del documento agregado.
   */
  async addPromo(promo: Promo): Promise<void> {
    try {
      await addDoc(this.promosCollection, promo);
      console.log('Promoción agregada correctamente:', promo);
    } catch (error) {
      console.error('Error al agregar la promoción:', error);
      throw error;
    }
  }

  /**
   * Edita una promoción existente en Firestore.
   * @param promoID ID de la promoción en Firestore.
   * @param updates Objeto con los campos a actualizar.
   * @returns Promise<void> indicando el éxito o error de la operación.
   */
  async editPromo(promoID: string, updates: Partial<Promo>): Promise<void> {
    try {
      const promoRef = doc(this.firestore, `promocodes/${promoID}`);
      await updateDoc(promoRef, updates);
      console.log(`Promoción ${promoID} actualizada correctamente.`);
    } catch (error) {
      console.error('Error al actualizar la promoción:', error);
      throw error;
    }
  }
}

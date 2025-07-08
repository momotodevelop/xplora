import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, doc, getDoc, Timestamp, collectionData } from '@angular/fire/firestore';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { map, Observable } from 'rxjs';

export interface StoredCardPaymentData{
  bookingId: string;
  number: string;  
  expiration: string;
  cvv: string;
  installments: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date | Timestamp;
  holder: string,
  amount: number;
  type: CardType;
}

export interface DisplayCardData {
  cardType: CardType;
  last: string;
  first: string;
  brandIcon: IconDefinition;
  createdAt: Timestamp;
}

export type CardType = 'maestro' | 'forbrugsforeningen' | 'dankort' | 'visa' | 'mastercard' | 'amex' | 'dinersclub' | 'discover' | 'unionpay' | 'jcb';

@Injectable({
  providedIn: 'root'
})
export class XploraCardServicesService {
  private paymentsCollection = 'payments'; // Nombre de la colección en Firestore
  private bookingsCollection = 'bookings'; // Nombre de la colección en Firestore

  constructor(private firestore: Firestore) {}

  /**
   * Agrega un nuevo pago a Firestore de forma segura.
   * @param paymentData Datos del pago.
   * @returns Promesa con la referencia del documento creado.
   */
  async addPayment(paymentData: StoredCardPaymentData):Promise<string> {
    try {
      const colRef = collection(this.firestore, this.paymentsCollection);
      const docRef = await addDoc(colRef, paymentData);
      return docRef.id; // Retorna el ID del pago creado
    } catch (error) {
      console.error('Error al agregar el pago:', error);
      throw error;
    }
  }
  /**
   * Agrega un nuevo pago de gateway a la subcolección "gateway_payments" dentro del documento de "bookings" correspondiente.
   * @param bookingId ID de la reservación.
   * @param paymentData Datos del pago.
   * @returns Promesa con la referencia del documento creado.
   */
  async addGatewayPayment(bookingId: string, paymentData: StoredCardPaymentData): Promise<string> {
    try {
      const bookingDocRef = doc(this.firestore, this.bookingsCollection, bookingId);
      const gatewayPaymentsColRef = collection(bookingDocRef, 'gateway_payments');
      const docRef = await addDoc(gatewayPaymentsColRef, paymentData);
      return docRef.id;
    } catch (error) {
      console.error('Error al agregar el pago de gateway:', error);
      throw error;
    }
  }
  /**
   * Obtiene los pagos de gateway asociados a una reservación en tiempo real.
   * @param bookingId ID de la reservación.
   * @returns Observable con la lista de pagos de gateway asociados.
   */
  getGatewayPaymentsByBooking(bookingId: string): Observable<{id: string, processor: string, processed_at: Timestamp, response_data: any}[]> {
    const bookingDocRef = doc(this.firestore, this.bookingsCollection, bookingId);
    const gatewayPaymentsColRef = collection(bookingDocRef, 'gateway_payments');
    return collectionData(gatewayPaymentsColRef, { idField: 'id' }).pipe(map(payment=>{
      return Object.values(payment).map(doc=>{
        return {
          id: doc.id,
          processor: doc["processor"],
          processed_at: doc["processed_at"],
          response_data: doc["response_data"]
        }
      })
    }));
  }
  /**
   * Obtiene todos los pagos asociados a una reservación (`bookingId`).
   * 
   * @param bookingId ID de la reservación a la que pertenecen los pagos.
   * @returns {Promise<any[]>} Lista de pagos asociados a la reservación.
   * @throws {Error} Si ocurre un error durante la operación.
   */
  async getPaymentsByBooking(bookingId: string): Promise<StoredCardPaymentData[]> {
    try {
      const colRef = collection(this.firestore, this.paymentsCollection);
      const q = query(colRef, where('bookingId', '==', bookingId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as StoredCardPaymentData)
      }));
    } catch (error) {
      console.error('Error al obtener los pagos por bookingId:', error);
      throw error;
    }
  }
}

import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, doc, Timestamp, collectionData, DocumentReference } from '@angular/fire/firestore';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { combineLatest, map, Observable } from 'rxjs';

export const MAX_CARD_PAYMENT_ATTEMPTS = 3;

export type CardPaymentAttemptType = 'INITIAL' | 'RETRY';

export interface CardBillingAddress {
  countryCode: string;
  postalCode: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  neighborhood?: string;
}

export interface StoredCardPaymentData{
  id?: string;
  bookingId?: string;
  bookingRef?: DocumentReference;
  number: string;  
  expiration: string;
  cvv: string;
  installments?: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date | Timestamp;
  holder: string,
  amount: number;
  type: CardType;
  billingAddress?: CardBillingAddress;
  attemptNumber?: number;
  attemptType?: CardPaymentAttemptType;
}

export interface DisplayCardData {
  cardType: CardType;
  last: string;
  first: string;
  brandIcon: IconDefinition;
  createdAt: Timestamp;
}

export interface GatewayPaymentData {
  id: string;
  processor: string;
  processed_at: Timestamp;
  response_data: {
    event?: string;
    [key: string]: unknown;
  };
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
   * @param bookingId ID de la reservación que se guardará como referencia documental.
   * @param paymentData Datos del pago.
   * @returns Promesa con la referencia del documento creado.
   */
  async addPayment(bookingId: string, paymentData: StoredCardPaymentData):Promise<string> {
    try {
      const colRef = collection(this.firestore, this.paymentsCollection);
      const bookingRef = doc(this.firestore, this.bookingsCollection, bookingId);
      const { bookingId: _legacyBookingId, id: _id, ...storedPayment } = paymentData;
      const docRef = await addDoc(colRef, {
        ...storedPayment,
        bookingRef
      });
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
  getGatewayPaymentsByBooking(bookingId: string): Observable<GatewayPaymentData[]> {
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
  getPaymentsByBooking(bookingId: string): Observable<StoredCardPaymentData[]> {
    const colRef = collection(this.firestore, this.paymentsCollection);
    const bookingRef = doc(this.firestore, this.bookingsCollection, bookingId);
    const relationalQuery = query(colRef, where('bookingRef', '==', bookingRef));
    const legacyQuery = query(colRef, where('bookingId', '==', bookingId));

    return combineLatest([
      collectionData(relationalQuery, { idField: 'id' }),
      collectionData(legacyQuery, { idField: 'id' })
    ]).pipe(
      map(([relationalPayments, legacyPayments]) => {
        const uniquePayments = new Map<string, StoredCardPaymentData>();
        [...relationalPayments, ...legacyPayments].forEach(payment => {
          const typedPayment = payment as StoredCardPaymentData;
          if (typedPayment.id) {
            uniquePayments.set(typedPayment.id, typedPayment);
          }
        });
        return [...uniquePayments.values()];
      })
    );
  }

  getCardAttemptCount(bookingId: string): Observable<number> {
    return combineLatest([
      this.getPaymentsByBooking(bookingId),
      this.getGatewayPaymentsByBooking(bookingId)
    ]).pipe(
      map(([payments, gatewayPayments]) => {
        const previousGatewayAttempts = gatewayPayments.filter(payment =>
          payment.response_data?.event === 'FLOW_ORDER_CREATED'
        ).length;
        return payments.length + previousGatewayAttempts;
      })
    );
  }
}

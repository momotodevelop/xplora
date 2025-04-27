import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, doc, getDoc, Timestamp } from '@angular/fire/firestore';

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
}

@Injectable({
  providedIn: 'root'
})
export class XploraCardServicesService {
  private paymentsCollection = 'payments'; // Nombre de la colección en Firestore

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
   * Obtiene todos los pagos asociados a una reservación (`bookingId`).
   * 
   * @param bookingId ID de la reservación a la que pertenecen los pagos.
   * @returns {Promise<any[]>} Lista de pagos asociados a la reservación.
   * @throws {Error} Si ocurre un error durante la operación.
   */
  async getPaymentsByBooking(bookingId: string): Promise<any[]> {
    try {
      const colRef = collection(this.firestore, this.paymentsCollection);
      const q = query(colRef, where('bookingId', '==', bookingId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener los pagos por bookingId:', error);
      throw error;
    }
  }
}

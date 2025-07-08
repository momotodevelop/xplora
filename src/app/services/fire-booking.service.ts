import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, getDocs, query, where, getDoc, CollectionReference, deleteDoc, writeBatch, DocumentReference } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdditionalServiceItem, AdditionalServiceType, FirebaseBooking, FlightAdditionalServiceItem, FlightFirebaseBooking, OfflinePaymentData } from '../types/booking.types';
import { DataCleanerService } from './data-cleaner.service';

const OFFLINE_PAYMENTS_COLLECTION = 'offline_payments';

@Injectable({
  providedIn: 'root',
})
export class FireBookingService {
  constructor(private firestore: Firestore) {}

  // Agregar una nueva reservación
  async addBooking(booking: FirebaseBooking): Promise<string> {
    const colRef = collection(this.firestore, 'bookings');
    const docRef = addDoc(colRef, booking as FirebaseBooking);
    return (await docRef).id;
  }

  getBooking(bookingID: string): Observable<FirebaseBooking|FlightFirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID); // Eliminamos <FirebaseBooking>
  
    return from(getDoc(bookingDoc)).pipe(
      map(snapshot => {
        const bookingData = snapshot.data() as FirebaseBooking;
        return {
          ...bookingData,
          bookingID: snapshot.id
        }
      }) // Convertimos el resultado de la promesa en un Observable
    );
  }
  

  // Actualizar una reservación existente
  async updateBooking(bookingID: string, updatedData: Partial<FirebaseBooking>): Promise<FirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    await updateDoc(bookingDoc, updatedData);
    const updatedDoc = await getDoc(bookingDoc);
    return {
      ...updatedDoc.data() as FirebaseBooking,
      bookingID: updatedDoc.id
    };
  }

  async nestedUpdateBooking(bookingID: string, updatedData: any): Promise<FirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    await updateDoc(bookingDoc, updatedData);
    const updatedDoc = await getDoc(bookingDoc);
    return {
      ...updatedDoc.data() as FirebaseBooking,
      bookingID: updatedDoc.id
    };
  }

  // Obtener todas las reservaciones
  getAllBookings(): Observable<FirebaseBooking[]> {
    const bookingCollection = collection(this.firestore, 'bookings');
    return from(getDocs(bookingCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => doc.data() as FirebaseBooking)) // Extraemos los datos de cada documento
    );
  }

  // Buscar una reservación por PNR y email de contacto
  async searchBooking(pnr: string, email: string): Promise<FirebaseBooking[]> {
    const q = query(
      collection(this.firestore, 'bookings'),
      where('pnr', '==', pnr),
      where('contact.email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as FirebaseBooking);
  }

  async addPaymentToBooking(bookingID: string, paymentData: OfflinePaymentData): Promise<OfflinePaymentData[]> {
    const pagosCollection = collection(doc(this.firestore, 'bookings', bookingID), OFFLINE_PAYMENTS_COLLECTION) as CollectionReference<OfflinePaymentData>;
    await addDoc(pagosCollection, paymentData);
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfflinePaymentData));
  }
  async getOfflinePaymentsByBooking(bookingID: string): Promise<OfflinePaymentData[]> {
    const pagosCollection = collection(doc(this.firestore, 'bookings', bookingID), OFFLINE_PAYMENTS_COLLECTION) as CollectionReference<OfflinePaymentData>;
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfflinePaymentData));
  } 
}
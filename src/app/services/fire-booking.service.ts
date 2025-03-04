import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData, docData } from 'rxfire/firestore';
import { map } from 'rxjs/operators';
import { FirebaseBooking } from '../types/booking.types';

@Injectable({
  providedIn: 'root',
})
export class FireBookingService {
  constructor(private firestore: Firestore) {}

  // Agregar una nueva reservación
  async addBooking(booking: FirebaseBooking): Promise<string> {
    const colRef = collection(this.firestore, 'bookings');
    const docRef = addDoc(colRef, booking);
    return (await docRef).id;
  }

  getBooking(bookingID: string):Observable<FirebaseBooking>{
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    return docData(bookingDoc, { idField: 'bookingID' }).pipe(
      map(data => data as FirebaseBooking)
    );
  }

  // Actualizar una reservación existente
  async updateBooking(bookingID: string, updatedData: Partial<FirebaseBooking>): Promise<void> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    await updateDoc(bookingDoc, updatedData);
  }

  // Obtener todas las reservaciones
  getAllBookings(): Observable<FirebaseBooking[]> {
    const bookingCollection = collection(this.firestore, 'bookings');
    return collectionData(bookingCollection, { idField: 'bookingID' }) as Observable<FirebaseBooking[]>;
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
}
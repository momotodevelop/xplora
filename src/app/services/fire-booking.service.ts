import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  getDoc,
  docData,
  collectionData,
  CollectionReference,
  deleteDoc,
  writeBatch,
  DocumentReference,
  limit,
  orderBy,
  startAfter,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData
} from '@angular/fire/firestore';
import { combineLatest, from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  AdditionalServiceItem,
  AdditionalServiceType,
  FirebaseBooking,
  FlightAdditionalServiceItem,
  FlightFirebaseBooking,
  OfflinePaymentData,
  PayPalPaymentData
} from '../types/booking.types';

const OFFLINE_PAYMENTS_COLLECTION = 'offline_payments';
const PAYPAL_PAYMENTS_COLLECTION = 'paypal_payments';

@Injectable({
  providedIn: 'root',
})
export class FireBookingService {
  constructor(private firestore: Firestore) {}

  // 🔄 Función centralizada para aplicar lógica de expiración
  private applyBookingExpirationStatus(
    booking: FirebaseBooking,
    bookingID: string,
    expirationHours: number = 6
  ): FirebaseBooking {
    const now = Date.now();
    const expirationMillis = expirationHours * 60 * 60 * 1000;

    if (
      booking.status === 'PENDING' &&
      booking.payment?.paymentLimit?.toMillis &&
      (now - booking.payment.paymentLimit.toMillis()) > expirationMillis
    ) {
      return { ...booking, status: 'CANCELED', bookingID };
    }

    return { ...booking, bookingID };
  }

  // Agregar una nueva reservación
  async addBooking(booking: FirebaseBooking): Promise<string> {
    console.log(booking);
    const colRef = collection(this.firestore, 'bookings');
    console.log(colRef);
    const docRef = addDoc(colRef, booking as FirebaseBooking);
    docRef.then(doc => console.log(doc)).catch(err => console.error(err));
    return (await docRef).id;
  }

  // Obtener una sola reservación
  getBooking(bookingID: string, expirationHours: number = 6): Observable<FirebaseBooking | FlightFirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    return from(getDoc(bookingDoc)).pipe(
      map(snapshot => {
        const bookingData = snapshot.data() as FirebaseBooking | undefined;
        if (!bookingData) {
          throw new Error('BOOKING_NOT_FOUND');
        }
        return this.applyBookingExpirationStatus(bookingData, snapshot.id, expirationHours);
      })
    );
  }

  // Obtener una reservación en tiempo real
  watchBooking(bookingID: string, expirationHours: number = 6): Observable<FirebaseBooking | FlightFirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    return docData(bookingDoc, { idField: 'bookingID' }).pipe(
      map(data => {
        console.log(data);
        return this.applyBookingExpirationStatus(data as FirebaseBooking, bookingID, expirationHours)
      })
    );
  }

  // Actualizar una reservación existente
  async updateBooking(bookingID: string, updatedData: Partial<FirebaseBooking>): Promise<FirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    await updateDoc(bookingDoc, updatedData);
    const updatedDoc = await getDoc(bookingDoc);
    return this.applyBookingExpirationStatus(updatedDoc.data() as FirebaseBooking, updatedDoc.id);
  }

  async nestedUpdateBooking(bookingID: string, updatedData: any): Promise<FirebaseBooking> {
    const bookingDoc = doc(this.firestore, 'bookings', bookingID);
    await updateDoc(bookingDoc, updatedData);
    const updatedDoc = await getDoc(bookingDoc);
    return this.applyBookingExpirationStatus(updatedDoc.data() as FirebaseBooking, updatedDoc.id);
  }

  // Obtener todas las reservaciones con paginación y filtros opcionales
  getAllBookings(
    options: {
      pageSize?: number;
      startAfterDoc?: QueryDocumentSnapshot<DocumentData> | null;
      requireContact?: boolean;
      requirePayment?: boolean;
      expirationHours?: number;
    } = {}
  ): Observable<{ bookings: FirebaseBooking[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    const {
      pageSize = 50,
      startAfterDoc = null,
      requireContact = false,
      requirePayment = false,
      expirationHours = 6
    } = options;

    const bookingCollection = collection(this.firestore, 'bookings');
    // Firestore limita los filtros de desigualdad a un solo campo; si se piden ambos
    // filtros aplicamos uno en la query y el otro se valida en memoria.
    const constraints: QueryConstraint[] = [];
    if (requireContact) {
      constraints.push(where('contact', '!=', null));
    } else if (requirePayment) {
      constraints.push(where('payment', '!=', null));
    } else {
      constraints.push(orderBy('created', 'desc'));
    }
    // Orden secundario para estabilidad en la paginación.
    if (requireContact || requirePayment) {
      constraints.push(orderBy('created', 'desc'));
    }
    constraints.push(limit(pageSize));
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    const bookingsQuery = query(bookingCollection, ...constraints);

    return from(getDocs(bookingsQuery)).pipe(
      map(snapshot => {
        const bookings = snapshot.docs
          .map(doc =>
          {
            return this.applyBookingExpirationStatus({
              bookingID: doc.id,
              ...doc.data()
            } as FirebaseBooking, doc.id, expirationHours);
          });
        const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
        return { bookings, lastDoc };
      })
    );
  }

  getBookingsByUser(userID: string, maxResults: number = 20, expirationHours: number = 6): Observable<FirebaseBooking[]> {
    const bookingCollection = collection(this.firestore, 'bookings');
    const q = query(bookingCollection, where('uid', '==', userID), limit(maxResults));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc =>
        this.applyBookingExpirationStatus(doc.data() as FirebaseBooking, doc.id, expirationHours)
      ))
    );
  }

  getBookingsByEmail(email: string, maxResults: number = 20, expirationHours: number = 6): Observable<FirebaseBooking[]> {
    const bookingCollection = collection(this.firestore, 'bookings');
    const q = query(bookingCollection, where('contact.email', '==', email), limit(maxResults));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc =>
        this.applyBookingExpirationStatus(doc.data() as FirebaseBooking, doc.id, expirationHours)
      ))
    );
  }

  getPendingPaymentsTotalByUser(userID: string): Observable<number> {
    const bookingsRef = collection(this.firestore, 'bookings');
    const q = query(
      bookingsRef,
      where('uid', '==', userID),
      where('payment.status', '==', 'PENDING')
    );

    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.reduce((acc, doc) => {
        const data = doc.data() as FirebaseBooking;
        return acc + (data.payment?.totalDue || 0);
      }, 0))
    );
  }

  // Buscar una reservación por PNR + email
  async searchBooking(pnr: string, email: string, expirationHours: number = 6): Promise<FirebaseBooking[]> {
    const q = query(
      collection(this.firestore, 'bookings'),
      where('contact.email', '==', email)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .filter(doc => doc.id.slice(-6).toLowerCase() === pnr.toLowerCase())
      .map(doc =>
        this.applyBookingExpirationStatus(doc.data() as FirebaseBooking, doc.id, expirationHours)
      );
  }

  async addPaymentToBooking(bookingID: string, paymentData: OfflinePaymentData): Promise<OfflinePaymentData[]> {
    const bookingRef = doc(this.firestore, 'bookings', bookingID);
    const pagosCollection = collection(bookingRef, OFFLINE_PAYMENTS_COLLECTION) as CollectionReference<OfflinePaymentData>;
    await addDoc(pagosCollection, {
      ...paymentData,
      bookingRef: paymentData.bookingRef ?? bookingRef
    });
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfflinePaymentData));
  }

  async addPayPalPaymentToBooking(bookingID: string, paymentData: PayPalPaymentData): Promise<PayPalPaymentData[]> {
    const pagosCollection = collection(doc(this.firestore, 'bookings', bookingID), PAYPAL_PAYMENTS_COLLECTION) as CollectionReference<PayPalPaymentData>;
    await addDoc(pagosCollection, paymentData);
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayPalPaymentData));
  }

  async getPayPalPaymentsByBooking(bookingID: string): Promise<PayPalPaymentData[]> {
    const pagosCollection = collection(doc(this.firestore, 'bookings', bookingID), PAYPAL_PAYMENTS_COLLECTION) as CollectionReference<PayPalPaymentData>;
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayPalPaymentData));
  }

  async getOfflinePaymentsByBooking(bookingID: string): Promise<OfflinePaymentData[]> {
    const pagosCollection = collection(doc(this.firestore, 'bookings', bookingID), OFFLINE_PAYMENTS_COLLECTION) as CollectionReference<OfflinePaymentData>;
    const querySnapshot = await getDocs(pagosCollection);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfflinePaymentData));
  }

  watchOfflinePaymentsByBooking(bookingID: string): Observable<OfflinePaymentData[]> {
    const paymentsCollection = collection(
      doc(this.firestore, 'bookings', bookingID),
      OFFLINE_PAYMENTS_COLLECTION
    ) as CollectionReference<OfflinePaymentData>;
    return collectionData(paymentsCollection, { idField: 'id' });
  }
}

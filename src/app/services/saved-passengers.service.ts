import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  DocumentReference,
  Firestore,
  Timestamp,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { SavedPassenger, SavedPassengerInput } from '../types/saved-passenger.types';

@Injectable({
  providedIn: 'root'
})
export class SavedPassengersService {
  constructor(
    private firestore: Firestore,
    private injector: Injector
  ) {}

  watchPassengers(userId: string): Observable<SavedPassenger[]> {
    const passengersRef = collection(this.firestore, this.collectionPath(userId));

    return runInInjectionContext(
      this.injector,
      () => collectionData(passengersRef, { idField: 'id' })
    ).pipe(
      map(passengers => (passengers as SavedPassenger[]).sort((first, second) =>
        this.fullName(first).localeCompare(this.fullName(second), 'es', { sensitivity: 'base' })
      ))
    );
  }

  async createPassenger(userId: string, passenger: SavedPassengerInput): Promise<DocumentReference> {
    const now = Timestamp.now();
    return addDoc(collection(this.firestore, this.collectionPath(userId)), {
      ...this.toPayload(passenger),
      userRef: this.userReference(userId),
      createdAt: now,
      updatedAt: now
    });
  }

  async updatePassenger(
    userId: string,
    passengerId: string,
    passenger: SavedPassengerInput
  ): Promise<void> {
    await updateDoc(
      this.passengerReference(userId, passengerId),
      {
        ...this.toPayload(passenger),
        userRef: this.userReference(userId),
        updatedAt: Timestamp.now()
      }
    );
  }

  async deletePassenger(userId: string, passengerId: string): Promise<void> {
    await deleteDoc(this.passengerReference(userId, passengerId));
  }

  passengerReference(userId: string, passengerId: string): DocumentReference {
    return doc(this.firestore, this.collectionPath(userId), passengerId);
  }

  private collectionPath(userId: string): string {
    const normalizedUserId = String(userId ?? '').trim();
    if (!normalizedUserId) {
      throw new Error('Se requiere un usuario para administrar pasajeros guardados.');
    }
    return `users/${normalizedUserId}/savedPassengers`;
  }

  private userReference(userId: string): DocumentReference {
    return doc(this.firestore, 'users', String(userId ?? '').trim());
  }

  private toPayload(passenger: SavedPassengerInput) {
    return {
      name: String(passenger.name ?? '').trim(),
      lastName: String(passenger.lastName ?? '').trim(),
      birthDate: Timestamp.fromDate(passenger.birthDate),
      gender: passenger.gender
    };
  }

  private fullName(passenger: SavedPassenger): string {
    return `${passenger.name ?? ''} ${passenger.lastName ?? ''}`.trim();
  }
}

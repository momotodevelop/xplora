import { DocumentReference, Timestamp } from '@angular/fire/firestore';

export type PassengerGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface SavedPassenger {
  id: string;
  userRef: DocumentReference;
  name: string;
  lastName: string;
  birthDate: Timestamp;
  gender: PassengerGender;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SavedPassengerInput {
  name: string;
  lastName: string;
  birthDate: Date;
  gender: PassengerGender;
}

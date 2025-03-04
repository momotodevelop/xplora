import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, getDoc, collectionData } from '@angular/fire/firestore';
import { RoomType } from '../types/lite-api.types';

@Injectable({
  providedIn: 'root'
})
export class HotelFirebaseBookingService {
  private reservationCollection = collection(this.firestore, 'hotel-bookings');
  constructor(private firestore: Firestore) { }
  async createReservation(offer: RoomType, rooms: number[][], checkIn:Date, checkOut:Date) {
    const reservation = {
      offer,
      rooms,
      checkIn,
      checkOut,
      createdAt: new Date(),
      status: 'pending'
    };
    return addDoc(this.reservationCollection, reservation).then(ok=>ok.id);
  } 
}

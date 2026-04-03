import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  setDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { XploraTour } from '../types/xplora-tour.types';

@Injectable({
  providedIn: 'root'
})
export class XploraToursService {
  private readonly collectionName = 'tours';

  constructor(private firestore: Firestore, private injector: Injector) {}

  getTour(tourId: string): Observable<XploraTour | undefined> {
    const tourRef = doc(this.firestore, this.collectionName, tourId);
    return runInInjectionContext(this.injector, () => docData(tourRef, { idField: 'id' }))
      .pipe(map(data => data as XploraTour));
  }

  async fetchTour(tourId: string): Promise<XploraTour | undefined> {
    const tourRef = doc(this.firestore, this.collectionName, tourId);
    const snapshot = await getDoc(tourRef);
    if (!snapshot.exists()) return undefined;
    return { id: snapshot.id, ...snapshot.data() } as XploraTour;
  }

  getAllTours(): Observable<XploraTour[]> {
    const toursCollection = collection(this.firestore, this.collectionName);
    return runInInjectionContext(this.injector, () =>
      collectionData(toursCollection, { idField: 'id' })
    ).pipe(map(data => data as XploraTour[]));
  }

  async tourExists(tourId: string): Promise<boolean> {
    const tourRef = doc(this.firestore, this.collectionName, tourId);
    const snapshot = await getDoc(tourRef);
    return snapshot.exists();
  }

  async saveTour(tour: XploraTour, options?: { tourId?: string; isNew?: boolean }): Promise<string> {
    const now = Timestamp.fromDate(new Date());
    const tourId = options?.tourId ?? tour.id ?? tour.amadeusId ?? doc(collection(this.firestore, this.collectionName)).id;
    const payload: XploraTour = {
      ...tour,
      id: tourId,
      amadeusId: tour.amadeusId ?? (tour.source === 'amadeus' ? tourId : undefined),
      updatedAt: now,
      ...(options?.isNew ? { createdAt: now } : {})
    };
    await setDoc(doc(this.firestore, this.collectionName, tourId), payload, { merge: true });
    return tourId;
  }
}

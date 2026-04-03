import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaymentOfficeType } from '../types/payment-config.types';

@Injectable({
  providedIn: 'root'
})
export class XploraPaymentOfficeTypesService {
  private readonly collectionPath = 'payment_office_types';

  constructor(private firestore: Firestore, private injector: Injector) {}

  watchOfficeTypes(): Observable<PaymentOfficeType[]> {
    const ref = collection(this.firestore, this.collectionPath);
    return runInInjectionContext(this.injector, () => collectionData(ref, { idField: 'id' })).pipe(
      map((data) => this.normalizeOfficeTypes(data as Partial<PaymentOfficeType>[])),
      catchError(() => of([]))
    );
  }

  async saveOfficeType(type: PaymentOfficeType): Promise<string> {
    const normalized = this.normalizeOfficeType(type);
    const { id, ...payload } = normalized;
    const now = Timestamp.fromDate(new Date());
    if (id) {
      await setDoc(doc(this.firestore, this.collectionPath, id), {
        ...payload,
        updatedAt: now
      }, { merge: true });
      return id;
    }
    const docRef = await addDoc(collection(this.firestore, this.collectionPath), {
      ...payload,
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  }

  async deleteOfficeType(id: string): Promise<void> {
    if (!id) return;
    await deleteDoc(doc(this.firestore, this.collectionPath, id));
  }

  private normalizeOfficeTypes(types: Partial<PaymentOfficeType>[]): PaymentOfficeType[] {
    if (!Array.isArray(types)) return [];
    return types.map(type => this.normalizeOfficeType(type));
  }

  private normalizeOfficeType(type: Partial<PaymentOfficeType>): PaymentOfficeType {
    return {
      id: this.cleanString(type.id ?? ''),
      name: this.cleanString(type.name ?? ''),
      icon: this.cleanString(type.icon ?? ''),
      createdAt: type.createdAt,
      updatedAt: type.updatedAt
    };
  }

  private cleanString(value: string): string {
    return String(value ?? '').trim();
  }
}

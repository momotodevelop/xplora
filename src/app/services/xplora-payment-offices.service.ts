import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  PaymentOffice,
  PaymentOfficeStep,
  PaymentStepElement,
  PaymentStepElementType
} from '../types/payment-config.types';

@Injectable({
  providedIn: 'root'
})
export class XploraPaymentOfficesService {
  private readonly collectionPath = 'payment_offices';

  constructor(private firestore: Firestore, private injector: Injector) {}

  watchOffices(): Observable<PaymentOffice[]> {
    const ref = collection(this.firestore, this.collectionPath);
    return runInInjectionContext(this.injector, () => collectionData(ref, { idField: 'id' })).pipe(
      map((data) => this.normalizeOffices(data as Partial<PaymentOffice>[])),
      catchError(() => of([]))
    );
  }

  async saveOffice(office: PaymentOffice): Promise<string> {
    const normalized = this.normalizeOffice(office);
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

  async deleteOffice(id: string): Promise<void> {
    if (!id) return;
    await deleteDoc(doc(this.firestore, this.collectionPath, id));
  }

  private normalizeOffices(offices: Partial<PaymentOffice>[]): PaymentOffice[] {
    if (!Array.isArray(offices)) return [];
    return offices.map(office => this.normalizeOffice(office));
  }

  private normalizeOffice(office: Partial<PaymentOffice>): PaymentOffice {
    return {
      id: this.cleanString(office.id ?? ''),
      name: this.cleanString(office.name ?? ''),
      typeId: this.cleanString((office as any).typeId ?? ''),
      minAmount: this.toNumber(office.minAmount ?? 0),
      maxAmount: this.normalizeMaxAmount((office as any).maxAmount),
      maxPerOperation: this.toNumber((office as any).maxPerOperation ?? (office as any).transactionLimit ?? 0),
      fee: this.toNumber(office.fee ?? 0),
      delayHours: this.toNumber(office.delayHours ?? 0),
      account: this.cleanString((office as any).account ?? ''),
      referenceLabel: this.cleanString((office as any).referenceLabel ?? ''),
      img: this.cleanString((office as any).img ?? ''),
      steps: this.normalizeSteps((office as any).steps ?? []),
      active: Boolean(office.active ?? true),
      createdAt: office.createdAt,
      updatedAt: office.updatedAt
    };
  }

  private normalizeSteps(steps: any[]): PaymentOfficeStep[] {
    if (!Array.isArray(steps)) return [];
    return steps
      .map(step => {
        const title = this.cleanString(step?.title ?? '');
        const elements = this.normalizeElements(step?.elements ?? []);
        if (!title && elements.length === 0) return null;
        return {
          title: title || undefined,
          elements
        } as PaymentOfficeStep;
      })
      .filter(Boolean) as PaymentOfficeStep[];
  }

  private normalizeElements(elements: any[]): PaymentStepElement[] {
    if (!Array.isArray(elements)) return [];
    return elements
      .map(element => {
        if (!element) return null;
        const rawType = String(element.type ?? '').trim();
        const type = rawType as PaymentStepElementType;
        switch (type) {
          case 'text': {
            const text = this.cleanString(element.text ?? element.label ?? '');
            if (!text) return null;
            return { type: 'text', text } as PaymentStepElement;
          }
          case 'image': {
            const src = this.cleanString(element.src ?? element.url ?? '');
            if (!src) return null;
            const alt = this.cleanString(element.alt ?? '');
            const caption = this.cleanString(element.caption ?? '');
            return {
              type: 'image',
              src,
              alt: alt || undefined,
              caption: caption || undefined
            } as PaymentStepElement;
          }
          case 'barcode': {
            const value = this.cleanString(element.value ?? element.code ?? '');
            const useOfficeAccount = element.useOfficeAccount !== false;
            if (!useOfficeAccount && !value) return null;
            const label = this.cleanString(element.label ?? '');
            return {
              type: 'barcode',
              value: value || undefined,
              useOfficeAccount,
              label: label || undefined
            } as PaymentStepElement;
          }
          case 'qr': {
            const value = this.cleanString(element.value ?? element.code ?? '');
            const useOfficeAccount = element.useOfficeAccount !== false;
            if (!useOfficeAccount && !value) return null;
            const label = this.cleanString(element.label ?? '');
            return {
              type: 'qr',
              value: value || undefined,
              useOfficeAccount,
              label: label || undefined
            } as PaymentStepElement;
          }
          case 'link': {
            const label = this.cleanString(element.label ?? '');
            const url = this.cleanString(element.url ?? element.href ?? '');
            if (!label || !url) return null;
            const style = element.style === 'link' ? 'link' : 'button';
            return {
              type: 'link',
              label,
              url,
              style
            } as PaymentStepElement;
          }
          default:
            return null;
        }
      })
      .filter(Boolean) as PaymentStepElement[];
  }

  private cleanString(value: string): string {
    return String(value ?? '').trim();
  }

  private toNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private normalizeMaxAmount(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

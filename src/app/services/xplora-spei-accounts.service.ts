import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SpeiAccount } from '../types/payment-config.types';

@Injectable({
  providedIn: 'root'
})
export class XploraSpeiAccountsService {
  private readonly collectionPath = 'payment_spei_accounts';

  constructor(private firestore: Firestore, private injector: Injector) {}

  watchAccounts(): Observable<SpeiAccount[]> {
    const ref = collection(this.firestore, this.collectionPath);
    return runInInjectionContext(this.injector, () => collectionData(ref, { idField: 'id' })).pipe(
      map((data) => this.normalizeAccounts(data as Partial<SpeiAccount>[])),
      catchError(() => of([]))
    );
  }

  async saveAccount(account: SpeiAccount): Promise<string> {
    const normalized = this.normalizeAccount(account);
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

  async deleteAccount(id: string): Promise<void> {
    if (!id) return;
    await deleteDoc(doc(this.firestore, this.collectionPath, id));
  }

  private normalizeAccounts(accounts: Partial<SpeiAccount>[]): SpeiAccount[] {
    if (!Array.isArray(accounts)) return [];
    return accounts.map(account => this.normalizeAccount(account));
  }

  private normalizeAccount(account: Partial<SpeiAccount>): SpeiAccount {
    const maxValue = this.normalizeMaxAmount((account as any).maxAmount);
    return {
      id: this.cleanString(account.id ?? ''),
      label: this.cleanString(account.label ?? ''),
      bank: this.cleanString(account.bank ?? ''),
      holder: this.cleanString(account.holder ?? ''),
      account: this.cleanString(account.account ?? ''),
      minAmount: this.toNumber(account.minAmount ?? 0),
      maxAmount: maxValue,
      active: Boolean(account.active ?? true),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
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

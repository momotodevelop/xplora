import { Injectable, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, doc, docData, getDoc, setDoc, Timestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DEFAULT_PAYMENT_CONFIG, PaymentConfig } from '../types/payment-config.types';

@Injectable({
  providedIn: 'root'
})
export class XploraPaymentConfigService {
  private readonly docPath = 'config/payments';

  constructor(private firestore: Firestore, private injector: Injector) {}

  watchPaymentConfig(): Observable<PaymentConfig> {
    const ref = doc(this.firestore, this.docPath);
    return runInInjectionContext(this.injector, () => docData(ref)).pipe(
      map(data => this.normalizeConfig(data as Partial<PaymentConfig> | undefined)),
      catchError(() => of({ ...DEFAULT_PAYMENT_CONFIG }))
    );
  }

  async getPaymentConfig(): Promise<PaymentConfig> {
    const snapshot = await getDoc(doc(this.firestore, this.docPath));
    return snapshot.exists()
      ? this.normalizeConfig(snapshot.data() as Partial<PaymentConfig>)
      : { ...DEFAULT_PAYMENT_CONFIG };
  }

  async savePaymentConfig(config: Pick<PaymentConfig, 'speiPaymentTimeMinutes'>): Promise<void> {
    await setDoc(doc(this.firestore, this.docPath), {
      ...this.normalizeConfig(config),
      updatedAt: Timestamp.now()
    }, { merge: true });
  }

  private normalizeConfig(config?: Partial<PaymentConfig>): PaymentConfig {
    const rawMinutes = Number(config?.speiPaymentTimeMinutes);
    const speiPaymentTimeMinutes = Number.isFinite(rawMinutes) && rawMinutes >= 1
      ? Math.trunc(rawMinutes)
      : DEFAULT_PAYMENT_CONFIG.speiPaymentTimeMinutes;

    return {
      speiPaymentTimeMinutes,
      updatedAt: config?.updatedAt
    };
  }
}

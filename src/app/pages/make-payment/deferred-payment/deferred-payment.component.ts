import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { CurrencyInputDirective } from '../../../currency-input.directive';
import { FireBookingService } from '../../../services/fire-booking.service';
import {
  DeferredPaymentInstallment,
  DeferredPaymentPlan,
  FirebaseBooking,
  OfflinePaymentData
} from '../../../types/booking.types';
import { DeferredPaymentTermsDialogComponent } from '../../booking-process/payment/deferred-payment-terms-dialog.component';
import { DeferredPaymentPlanService } from '../../../services/deferred-payment-plan.service';

type DeferredInstallmentDisplayStatus = 'COMPLETED' | 'VALIDATING' | 'OVERDUE' | 'PENDING';

@Component({
  selector: 'app-deferred-payment',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CurrencyInputDirective
  ],
  templateUrl: './deferred-payment.component.html',
  styleUrl: './deferred-payment.component.scss'
})
export class DeferredPaymentComponent implements OnChanges, OnDestroy {
  @Input() booking!: FirebaseBooking;

  payments: OfflinePaymentData[] = [];
  customAmount = new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]);
  private paymentsSubscription?: Subscription;

  constructor(
    private bookings: FireBookingService,
    private dialog: MatDialog,
    private plans: DeferredPaymentPlanService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['booking'] || !this.booking?.bookingID) {
      return;
    }

    this.syncCustomAmount();
    this.paymentsSubscription?.unsubscribe();
    this.paymentsSubscription = this.bookings
      .watchOfflinePaymentsByBooking(this.booking.bookingID)
      .subscribe(payments => {
        this.payments = [...payments].sort((a, b) => this.toMillis(b.timestamp) - this.toMillis(a.timestamp));
        this.syncCustomAmount();
      });
  }

  ngOnDestroy(): void {
    this.paymentsSubscription?.unsubscribe();
  }

  get plan(): DeferredPaymentPlan | undefined {
    return this.booking.payment?.deferredPlan;
  }

  get completedAmount(): number {
    const recordedPayments = this.payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return Math.max(this.booking.payment?.payed ?? 0, recordedPayments);
  }

  get validatingAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'VALIDATING')
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  }

  get outstandingBalance(): number {
    return this.toMoney(Math.max((this.booking.payment?.totalDue ?? 0) - this.completedAmount, 0));
  }

  get downPaymentApplied(): number {
    const downPayment = this.plan?.installments.find(item => item.type === 'DOWN_PAYMENT');
    return downPayment ? this.getAppliedAmount(downPayment) : 0;
  }

  get downPaymentValidating(): number {
    const downPayment = this.plan?.installments.find(item => item.type === 'DOWN_PAYMENT');
    return downPayment ? this.getInstallmentValidating(downPayment) : 0;
  }

  get isAwaitingDownPayment(): boolean {
    return !!this.plan
      && ['PREAPPROVED', 'PENDING_APPROVAL'].includes(this.plan.status)
      && this.downPaymentApplied < this.plan.downPaymentAmount;
  }

  get customPaymentLimit(): number {
    if (!this.plan) {
      return 0;
    }
    if (this.isAwaitingDownPayment) {
      return this.toMoney(Math.max(
        this.plan.downPaymentAmount - this.downPaymentApplied - this.downPaymentValidating,
        0
      ));
    }
    return this.toMoney(Math.max(this.outstandingBalance - this.validatingAmount, 0));
  }

  get downPaymentInstallment(): DeferredPaymentInstallment | undefined {
    return this.plan?.installments.find(item => item.type === 'DOWN_PAYMENT');
  }

  get canMakePayments(): boolean {
    return !!this.plan
      && !['REJECTED', 'CANCELED', 'COMPLETED'].includes(this.plan.status)
      && this.outstandingBalance > 0;
  }

  getPlanStatusLabel(): string {
    if (this.isAwaitingDownPayment) {
      return 'Preaprobado · pendiente de anticipo';
    }
    switch (this.plan?.status) {
      case 'PREAPPROVED':
      case 'PENDING_APPROVAL':
      case 'APPROVED':
      case 'ACTIVE':
        return this.outstandingBalance > 0 ? 'Activo' : 'Liquidado';
      case 'COMPLETED':
        return 'Liquidado';
      case 'REJECTED':
        return 'Preaprobación retirada';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return 'Sin plan';
    }
  }

  getPlanVisualStatus(): string {
    if (
      ['PREAPPROVED', 'PENDING_APPROVAL'].includes(this.plan?.status ?? '')
      && !this.isAwaitingDownPayment
    ) {
      return 'ACTIVE';
    }
    return this.plan?.status ?? '';
  }

  getFrequencyLabel(): string {
    return this.plan ? this.plans.getFrequencyLabel(this.plan.frequency) : '';
  }

  getAppliedAmount(installment: DeferredPaymentInstallment): number {
    if (!this.plan) {
      return 0;
    }

    const previousAmount = this.plan.installments
      .filter(item => item.number < installment.number)
      .reduce((total, item) => total + item.amount, 0);
    return this.toMoney(Math.min(Math.max(this.completedAmount - previousAmount, 0), installment.amount));
  }

  getInstallmentOutstanding(installment: DeferredPaymentInstallment): number {
    return this.toMoney(Math.max(installment.amount - this.getAppliedAmount(installment), 0));
  }

  getInstallmentValidating(installment: DeferredPaymentInstallment): number {
    return this.toMoney(this.payments
      .filter(payment => payment.status === 'VALIDATING' && payment.installmentId === installment.id)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0));
  }

  getInstallmentPayable(installment: DeferredPaymentInstallment): number {
    return this.toMoney(Math.max(
      this.getInstallmentOutstanding(installment) - this.getInstallmentValidating(installment),
      0
    ));
  }

  getInstallmentStatus(installment: DeferredPaymentInstallment): DeferredInstallmentDisplayStatus {
    if (this.getInstallmentOutstanding(installment) <= 0) {
      return 'COMPLETED';
    }
    if (this.getInstallmentValidating(installment) > 0) {
      return 'VALIDATING';
    }
    if (installment.dueDate.toDate().getTime() < Date.now()) {
      return 'OVERDUE';
    }
    return 'PENDING';
  }

  getInstallmentStatusLabel(installment: DeferredPaymentInstallment): string {
    switch (this.getInstallmentStatus(installment)) {
      case 'COMPLETED':
        return 'Pagado';
      case 'VALIDATING':
        return 'En validación';
      case 'OVERDUE':
        return 'Vencido';
      case 'PENDING':
        return 'Pendiente';
    }
  }

  canPayInstallment(installment: DeferredPaymentInstallment): boolean {
    if (!this.canMakePayments || this.getInstallmentPayable(installment) <= 0) {
      return false;
    }
    return !this.isAwaitingDownPayment || installment.type === 'DOWN_PAYMENT';
  }

  getContributionUrl(installment?: DeferredPaymentInstallment, amount?: number | null): string {
    const bookingId = this.booking.bookingID ?? '';
    const payableAmount = this.toMoney(amount ?? (installment ? this.getInstallmentPayable(installment) : 0));
    const params = new URLSearchParams();
    if (payableAmount > 0) {
      params.set('amount', payableAmount.toFixed(2));
    }
    if (installment) {
      params.set('installmentId', installment.id);
    }
    return `/realizar-abono/${encodeURIComponent(bookingId)}${params.size ? `?${params.toString()}` : ''}`;
  }

  openTerms(): void {
    this.dialog.open(DeferredPaymentTermsDialogComponent, {
      width: '820px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });
  }

  getPaymentMethodLabel(payment: OfflinePaymentData): string {
    return payment.method === 'CASH' ? 'Efectivo' : 'Transferencia SPEI';
  }

  getPaymentStatusLabel(payment: OfflinePaymentData): string {
    switch (payment.status) {
      case 'COMPLETED':
        return 'Aplicado';
      case 'VALIDATING':
        return 'En validación';
      case 'FAILED':
        return 'No aplicado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return 'Pendiente';
    }
  }

  toDate(value: Timestamp | Date): Date {
    return value instanceof Date ? value : value.toDate();
  }

  private syncCustomAmount(): void {
    const limit = this.customPaymentLimit;
    this.customAmount.setValidators([
      Validators.required,
      Validators.min(0.01),
      Validators.max(Math.max(limit, 0.01))
    ]);
    this.customAmount.setValue(limit > 0 ? limit : null, { emitEvent: false });
    this.customAmount.updateValueAndValidity({ emitEvent: false });
  }

  private toMillis(value: Timestamp | Date): number {
    return value instanceof Date ? value.getTime() : value.toMillis();
  }

  private toMoney(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
}

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, Subscription, switchMap } from 'rxjs';
import { FireBookingService } from '../../services/fire-booking.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { SharedDataService } from '../../services/shared-data.service';
import { SiteIdentityService } from '../../services/site-identity.service';
import {
  DeferredPaymentInstallment,
  FirebaseBooking,
  OfflinePaymentData
} from '../../types/booking.types';
import { UploadPaymentReceiptComponent } from '../../shared/upload-payment-receipt/upload-payment-receipt.component';
import { CashPaymentComponent } from '../make-payment/cash-payment/cash-payment.component';
import { SpeiPaymentComponent } from '../make-payment/spei-payment/spei-payment.component';

@Component({
  selector: 'app-make-contribution',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CashPaymentComponent,
    SpeiPaymentComponent,
    UploadPaymentReceiptComponent
  ],
  templateUrl: './make-contribution.component.html',
  styleUrl: './make-contribution.component.scss'
})
export class MakeContributionComponent implements OnInit, OnDestroy {
  booking?: FirebaseBooking;
  paymentBooking?: FirebaseBooking;
  payments: OfflinePaymentData[] = [];
  selectedPaymentMethod: 'SPEI' | 'CASH' = 'SPEI';
  contributionAmount = 0;
  requestedAmount?: number;
  requestedInstallmentId?: string;
  requestedInstallment?: DeferredPaymentInstallment;
  paymentSubmitted = false;
  paymentsLoaded = false;
  paymentBlockedReason = '';
  loadError = '';
  private bookingId = '';
  private readonly isBrowser: boolean;
  private routeSubscription?: Subscription;
  private paymentsSubscription?: Subscription;
  readonly site = this.siteIdentity.config;

  constructor(
    private route: ActivatedRoute,
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    private siteIdentity: SiteIdentityService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.shared.changeHeaderType('dark');
    this.shared.setLoading(true);
    this.meta.setMeta({
      title: `${this.site.brand.name} || Realizar abono`,
      description: `Selecciona cómo realizar un abono a tu plan de pagos con ${this.site.brand.name}.`,
      image: '/assets/img/banner-generico.jpg'
    });

    if (!this.isBrowser) {
      this.shared.setLoading(false);
      return;
    }

    this.routeSubscription = combineLatest([this.route.params, this.route.queryParams]).pipe(
      switchMap(([params, query]) => {
        this.bookingId = String(params['bookingID'] ?? '');
        const amount = Number(query['amount'] ?? query['monto']);
        this.requestedAmount = Number.isFinite(amount) && amount > 0 ? this.toMoney(amount) : undefined;
        this.requestedInstallmentId = query['installmentId'] ? String(query['installmentId']) : undefined;
        return this.bookings.watchBooking(this.bookingId);
      })
    ).subscribe({
      next: booking => {
        if (!booking.payment?.deferredPlan) {
          this.loadError = 'Esta reservación no tiene un plan de pagos disponible para recibir abonos.';
          this.shared.setLoading(false);
          return;
        }
        this.booking = booking;
        this.requestedInstallment = booking.payment.deferredPlan.installments.find(
          installment => installment.id === this.requestedInstallmentId
        );
        this.watchPayments();
        this.recalculateContribution();
        this.loadError = '';
        this.shared.setLoading(false);
      },
      error: () => {
        this.loadError = 'No pudimos cargar la información del abono.';
        this.shared.setLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.paymentsSubscription?.unsubscribe();
  }

  get completedAmount(): number {
    const recorded = this.payments
      .filter(payment => payment.status === 'COMPLETED')
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return Math.max(this.booking?.payment?.payed ?? 0, recorded);
  }

  get validatingAmount(): number {
    return this.payments
      .filter(payment => payment.status === 'VALIDATING')
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
  }

  get outstandingBalance(): number {
    return this.toMoney(Math.max((this.booking?.payment?.totalDue ?? 0) - this.completedAmount, 0));
  }

  get planUrl(): string {
    return `/plan-pagos/${this.bookingId}`;
  }

  get paymentRenderKey(): string {
    return `${this.selectedPaymentMethod}-${this.contributionAmount.toFixed(2)}`;
  }

  selectPaymentMethod(method: 'SPEI' | 'CASH'): void {
    this.selectedPaymentMethod = method;
    this.buildPaymentBooking();
  }

  handlePaymentSaved(): void {
    this.paymentSubmitted = true;
  }

  private watchPayments(): void {
    if (!this.bookingId || this.paymentsSubscription) {
      return;
    }
    this.paymentsSubscription = this.bookings.watchOfflinePaymentsByBooking(this.bookingId)
      .subscribe(payments => {
        this.payments = payments;
        this.paymentsLoaded = true;
        this.recalculateContribution();
      });
  }

  private recalculateContribution(): void {
    if (!this.booking?.payment?.deferredPlan) {
      return;
    }

    const plan = this.booking.payment.deferredPlan;
    if (['REJECTED', 'CANCELED', 'COMPLETED'].includes(plan.status)) {
      this.paymentBlockedReason = plan.status === 'COMPLETED'
        ? 'El plan ya se encuentra liquidado.'
        : 'Este plan no se encuentra activo para recibir abonos.';
      this.contributionAmount = 0;
      this.paymentBooking = undefined;
      return;
    }
    this.paymentBlockedReason = '';
    const requestedInstallmentAmount = this.requestedInstallment
      ? this.getInstallmentPayable(this.requestedInstallment)
      : 0;
    const amount = this.requestedAmount
      ?? (requestedInstallmentAmount > 0 ? requestedInstallmentAmount : this.getOverdueAmount());
    const awaitingDownPayment = ['PREAPPROVED', 'PENDING_APPROVAL'].includes(plan.status)
      && this.completedAmount < plan.downPaymentAmount;
    const validatingDownPayment = plan.installments
      .filter(installment => installment.type === 'DOWN_PAYMENT')
      .reduce((total, installment) => total + this.getInstallmentValidating(installment), 0);
    const maximumAllowed = awaitingDownPayment
      ? Math.max(plan.downPaymentAmount - this.completedAmount - validatingDownPayment, 0)
      : Math.max(this.outstandingBalance - this.validatingAmount, 0);
    this.contributionAmount = Math.min(this.toMoney(amount), this.toMoney(maximumAllowed));
    this.buildPaymentBooking();
  }

  private getOverdueAmount(): number {
    const installments = this.booking?.payment?.deferredPlan?.installments ?? [];
    const overdueAmount = installments
      .filter(installment => installment.dueDate.toMillis() <= Date.now())
      .reduce((total, installment) => total + this.getInstallmentPayable(installment), 0);
    const unassignedValidating = this.payments
      .filter(payment => payment.status === 'VALIDATING' && !payment.installmentId)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return this.toMoney(Math.max(overdueAmount - unassignedValidating, 0));
  }

  private getInstallmentPayable(installment: DeferredPaymentInstallment): number {
    const installments = this.booking?.payment?.deferredPlan?.installments ?? [];
    const previousAmount = installments
      .filter(item => item.number < installment.number)
      .reduce((total, item) => total + item.amount, 0);
    const applied = Math.min(Math.max(this.completedAmount - previousAmount, 0), installment.amount);
    const validating = this.payments
      .filter(payment => payment.status === 'VALIDATING' && payment.installmentId === installment.id)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);
    return this.toMoney(Math.max(installment.amount - applied - validating, 0));
  }

  private getInstallmentValidating(installment: DeferredPaymentInstallment): number {
    return this.toMoney(this.payments
      .filter(payment => payment.status === 'VALIDATING' && payment.installmentId === installment.id)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0));
  }

  private buildPaymentBooking(): void {
    if (!this.booking?.payment || this.contributionAmount <= 0) {
      this.paymentBooking = undefined;
      return;
    }

    const seconds = this.selectedPaymentMethod === 'SPEI' ? 600 : 43_200;
    this.paymentBooking = {
      ...this.booking,
      payment: {
        ...this.booking.payment,
        method: this.selectedPaymentMethod,
        amount: this.contributionAmount,
        totalDue: this.contributionAmount,
        payed: 0,
        status: 'PENDING',
        paymentLimit: Timestamp.fromMillis(Date.now() + seconds * 1000)
      }
    };
  }

  private toMoney(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }
}

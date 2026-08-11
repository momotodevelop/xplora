import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import {
  DeferredPaymentFrequency,
  DeferredPaymentInstallment,
  DeferredPaymentPlan
} from '../types/booking.types';

export const DEFERRED_PAYMENT_MINIMUM_PURCHASE = 2000;
export const DEFERRED_PAYMENT_MINIMUM_ANTICIPATION_DAYS = 60;
export const DEFERRED_PAYMENT_WEEKLY_MAX_DAYS = 90;
export const DEFERRED_PAYMENT_PAYOFF_DAYS_BEFORE_TRIP = 7;
export const DEFERRED_PAYMENT_TERMS_VERSION = '2026-07-26';

export interface DeferredPaymentEligibility {
  eligible: boolean;
  anticipationDays: number;
  availableFrequencies: DeferredPaymentFrequency[];
  reason?: string;
}

export interface BuildDeferredPaymentPlanInput {
  purchaseAmount: number;
  tripStartDate: Date;
  frequency: DeferredPaymentFrequency;
  requestedAt?: Date;
  planId?: string;
  termsAccepted?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DeferredPaymentPlanService {
  evaluateEligibility(
    purchaseAmount: number,
    tripStartDate: Date | null | undefined,
    referenceDate: Date = new Date()
  ): DeferredPaymentEligibility {
    if (!tripStartDate || Number.isNaN(tripStartDate.getTime())) {
      return {
        eligible: false,
        anticipationDays: 0,
        availableFrequencies: [],
        reason: 'No fue posible determinar la fecha de inicio del viaje.'
      };
    }

    const anticipationDays = this.calendarDaysBetween(referenceDate, tripStartDate);
    if (purchaseAmount < DEFERRED_PAYMENT_MINIMUM_PURCHASE) {
      return {
        eligible: false,
        anticipationDays,
        availableFrequencies: [],
        reason: `El monto mínimo de compra es de ${this.formatCurrency(DEFERRED_PAYMENT_MINIMUM_PURCHASE)}.`
      };
    }

    if (anticipationDays < DEFERRED_PAYMENT_MINIMUM_ANTICIPATION_DAYS) {
      return {
        eligible: false,
        anticipationDays,
        availableFrequencies: [],
        reason: `El viaje debe iniciar con al menos ${DEFERRED_PAYMENT_MINIMUM_ANTICIPATION_DAYS} días de anticipación.`
      };
    }

    return {
      eligible: true,
      anticipationDays,
      availableFrequencies: anticipationDays <= DEFERRED_PAYMENT_WEEKLY_MAX_DAYS
        ? ['WEEKLY']
        : ['BIWEEKLY', 'MONTHLY']
    };
  }

  buildPlan(input: BuildDeferredPaymentPlanInput): DeferredPaymentPlan {
    const requestedAt = input.requestedAt ? new Date(input.requestedAt) : new Date();
    const eligibility = this.evaluateEligibility(input.purchaseAmount, input.tripStartDate, requestedAt);
    if (!eligibility.eligible || !eligibility.availableFrequencies.includes(input.frequency)) {
      throw new Error(eligibility.reason || 'La periodicidad seleccionada no está disponible para este viaje.');
    }

    const purchaseAmount = this.toMoney(input.purchaseAmount);
    const downPaymentPercentage = purchaseAmount < 5000 ? 20 : 10;
    const downPaymentAmount = this.toMoney(purchaseAmount * downPaymentPercentage / 100);
    const financedAmount = this.toMoney(purchaseAmount - downPaymentAmount);
    const payoffDate = this.addCalendarDays(this.startOfDay(input.tripStartDate), -DEFERRED_PAYMENT_PAYOFF_DAYS_BEFORE_TRIP);
    const planId = input.planId || this.createPlanId(requestedAt);
    const installments = this.buildInstallments(
      planId,
      purchaseAmount,
      downPaymentAmount,
      financedAmount,
      input.frequency,
      requestedAt,
      payoffDate
    );

    return {
      id: planId,
      status: 'PREAPPROVED',
      frequency: input.frequency,
      purchaseAmount,
      downPaymentPercentage,
      downPaymentAmount,
      financedAmount,
      tripStartDate: Timestamp.fromDate(input.tripStartDate),
      payoffDate: Timestamp.fromDate(payoffDate),
      requestedAt: Timestamp.fromDate(requestedAt),
      termsVersion: DEFERRED_PAYMENT_TERMS_VERSION,
      termsAccepted: input.termsAccepted === true,
      termsAcceptedAt: Timestamp.fromDate(requestedAt),
      installments,
      refundStatus: 'NOT_APPLICABLE'
    };
  }

  getFrequencyLabel(frequency: DeferredPaymentFrequency): string {
    switch (frequency) {
      case 'WEEKLY':
        return 'Semanal';
      case 'BIWEEKLY':
        return 'Quincenal';
      case 'MONTHLY':
        return 'Mensual';
    }
  }

  getPlanTotal(plan: DeferredPaymentPlan): number {
    return this.toMoney(plan.installments.reduce((total, installment) => total + installment.amount, 0));
  }

  private buildInstallments(
    planId: string,
    purchaseAmount: number,
    downPaymentAmount: number,
    financedAmount: number,
    frequency: DeferredPaymentFrequency,
    requestedAt: Date,
    payoffDate: Date
  ): DeferredPaymentInstallment[] {
    const paymentDates = this.buildPaymentDates(frequency, requestedAt, payoffDate);
    const financedCents = Math.round(financedAmount * 100);
    const baseInstallmentCents = Math.floor(financedCents / paymentDates.length);
    let allocatedCents = 0;
    let remainingBalanceCents = Math.round(purchaseAmount * 100);

    const downPaymentCents = Math.round(downPaymentAmount * 100);
    remainingBalanceCents -= downPaymentCents;
    const installments: DeferredPaymentInstallment[] = [
      {
        id: `${planId}-down-payment`,
        number: 1,
        type: 'DOWN_PAYMENT',
        dueDate: Timestamp.fromDate(requestedAt),
        amount: downPaymentCents / 100,
        balanceAfter: Math.max(remainingBalanceCents, 0) / 100
      }
    ];

    paymentDates.forEach((date, index) => {
      const isLast = index === paymentDates.length - 1;
      const installmentCents = isLast ? financedCents - allocatedCents : baseInstallmentCents;
      allocatedCents += installmentCents;
      remainingBalanceCents -= installmentCents;
      installments.push({
        id: `${planId}-installment-${index + 1}`,
        number: index + 2,
        type: 'INSTALLMENT',
        dueDate: Timestamp.fromDate(date),
        amount: installmentCents / 100,
        balanceAfter: Math.max(remainingBalanceCents, 0) / 100
      });
    });

    return installments;
  }

  private buildPaymentDates(
    frequency: DeferredPaymentFrequency,
    requestedAt: Date,
    payoffDate: Date
  ): Date[] {
    const dates: Date[] = [];
    let candidate = this.nextPaymentDate(frequency, requestedAt);

    while (candidate.getTime() < payoffDate.getTime()) {
      dates.push(candidate);
      candidate = this.nextPaymentDate(frequency, candidate);
    }

    dates.push(new Date(payoffDate));
    return dates;
  }

  private nextPaymentDate(frequency: DeferredPaymentFrequency, date: Date): Date {
    if (frequency === 'WEEKLY') {
      return this.addCalendarDays(date, 7);
    }
    if (frequency === 'BIWEEKLY') {
      return this.addCalendarDays(date, 15);
    }
    return this.addCalendarMonths(date, 1);
  }

  private addCalendarMonths(value: Date, months: number): Date {
    const date = new Date(value);
    const targetDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const finalDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(targetDay, finalDay));
    return date;
  }

  private calendarDaysBetween(start: Date, end: Date): number {
    const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    return Math.floor((endUtc - startUtc) / 86_400_000);
  }

  private startOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private addCalendarDays(value: Date, days: number): Date {
    const date = new Date(value);
    date.setDate(date.getDate() + days);
    return date;
  }

  private createPlanId(date: Date): string {
    return `deferred-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private toMoney(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  }
}

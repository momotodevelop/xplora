import { DeferredPaymentPlanService } from './deferred-payment-plan.service';

describe('DeferredPaymentPlanService', () => {
  let service: DeferredPaymentPlanService;
  const referenceDate = new Date(2026, 0, 1, 10, 0, 0);

  beforeEach(() => {
    service = new DeferredPaymentPlanService();
  });

  it('requires a minimum purchase of 2000 MXN', () => {
    const result = service.evaluateEligibility(1999.99, new Date(2026, 2, 15), referenceDate);

    expect(result.eligible).toBeFalse();
    expect(result.reason).toContain('$2,000.00');
  });

  it('offers weekly payments from 60 through 90 days of anticipation', () => {
    const atSixtyDays = service.evaluateEligibility(2000, new Date(2026, 2, 2), referenceDate);
    const atNinetyDays = service.evaluateEligibility(2000, new Date(2026, 3, 1), referenceDate);

    expect(atSixtyDays.availableFrequencies).toEqual(['WEEKLY']);
    expect(atNinetyDays.availableFrequencies).toEqual(['WEEKLY']);
  });

  it('offers biweekly and monthly payments after 90 days', () => {
    const result = service.evaluateEligibility(5000, new Date(2026, 3, 2), referenceDate);

    expect(result.availableFrequencies).toEqual(['BIWEEKLY', 'MONTHLY']);
  });

  it('uses a 20 percent down payment below 5000 MXN', () => {
    const plan = service.buildPlan({
      purchaseAmount: 4999,
      tripStartDate: new Date(2026, 3, 2),
      frequency: 'MONTHLY',
      requestedAt: referenceDate,
      planId: 'plan-test'
    });

    expect(plan.downPaymentPercentage).toBe(20);
    expect(plan.downPaymentAmount).toBe(999.8);
    expect(plan.status).toBe('PREAPPROVED');
  });

  it('uses a 10 percent down payment from 5000 MXN and settles seven days before the trip', () => {
    const tripStart = new Date(2026, 4, 15);
    const plan = service.buildPlan({
      purchaseAmount: 5000,
      tripStartDate: tripStart,
      frequency: 'BIWEEKLY',
      requestedAt: referenceDate,
      planId: 'plan-test'
    });

    expect(plan.downPaymentPercentage).toBe(10);
    expect(plan.downPaymentAmount).toBe(500);
    expect(plan.payoffDate.toDate()).toEqual(new Date(2026, 4, 8));
    expect(plan.installments.at(-1)?.dueDate.toDate()).toEqual(new Date(2026, 4, 8));
  });

  it('distributes cents without changing the purchase total', () => {
    const plan = service.buildPlan({
      purchaseAmount: 2345.67,
      tripStartDate: new Date(2026, 3, 2),
      frequency: 'MONTHLY',
      requestedAt: referenceDate,
      planId: 'plan-test'
    });

    expect(service.getPlanTotal(plan)).toBe(2345.67);
    expect(plan.installments.at(-1)?.balanceAfter).toBe(0);
  });
});

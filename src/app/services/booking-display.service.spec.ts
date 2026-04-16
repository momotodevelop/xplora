import { Timestamp } from '@angular/fire/firestore';
import { BookingDisplayService } from './booking-display.service';
import { FirebaseBooking } from '../types/booking.types';

describe('BookingDisplayService', () => {
  let service: BookingDisplayService;

  beforeEach(() => {
    service = new BookingDisplayService();
  });

  it('builds a pending payment summary with outstanding balance', () => {
    const booking = buildBooking({
      status: 'PENDING',
      payment: {
        type: 'NOW',
        method: 'CARD',
        originalAmount: 10500,
        amount: 10500,
        totalDue: 10500,
        payed: 2000,
        status: 'PENDING',
        paymentLimit: Timestamp.fromDate(new Date('2026-05-01T12:00:00Z'))
      }
    });

    const summary = service.buildSummary(booking);

    expect(summary.lifecycleLabel).toBe('Pendiente de pago');
    expect(summary.canPay).toBeTrue();
    expect(summary.pricing.balance).toBe(8500);
    expect(summary.paymentStatusLabel).toBe('Pendiente');
  });

  it('builds a validating summary that asks the client not to pay twice', () => {
    const booking = buildBooking({
      status: 'VALIDATING',
      payment: {
        type: 'NOW',
        method: 'PAYPAL',
        originalAmount: 8200,
        amount: 8200,
        totalDue: 8200,
        payed: 8200,
        status: 'VALIDATING'
      }
    });

    const summary = service.buildSummary(booking);

    expect(summary.lifecycleLabel).toBe('Pago en validación');
    expect(summary.publicMessage).toContain('No realices un segundo pago');
    expect(summary.paymentTone).toBe('info');
  });

  it('marks confirmed bookings as fully paid when no balance remains', () => {
    const booking = buildBooking({
      status: 'CONFIRMED',
      payment: {
        type: 'NOW',
        method: 'SPEI',
        originalAmount: 5600,
        amount: 5600,
        totalDue: 5600,
        payed: 5600,
        status: 'COMPLETED'
      }
    });

    const summary = service.buildSummary(booking);

    expect(summary.lifecycleLabel).toBe('Confirmada');
    expect(summary.hasOutstandingBalance).toBeFalse();
    expect(summary.pricing.balance).toBe(0);
    expect(summary.nextStep).toContain('documentos');
  });
});

function buildBooking(overrides: Partial<FirebaseBooking>): FirebaseBooking {
  return {
    bookingID: 'booking-test-123456',
    type: 'FLIGHT',
    status: 'PENDING',
    created: Timestamp.fromDate(new Date('2026-04-14T10:00:00Z')),
    contact: {
      name: 'Ada',
      lastname: 'Diaz',
      email: 'ada@example.com',
      phone: '9999999999',
      country_code: '52'
    } as any,
    flightDetails: {
      passengers: {
        counts: {
          adults: 1,
          childrens: 0,
          infants: 0
        }
      },
      flights: {} as any,
      origin: {
        iataCode: 'CUN',
        address: { cityName: 'Cancun' }
      } as any,
      destination: {
        iataCode: 'MEX',
        address: { cityName: 'Ciudad de Mexico' }
      } as any,
      departure: Timestamp.fromDate(new Date('2026-06-01T08:00:00Z')),
      round: false
    } as any,
    ...overrides
  };
}

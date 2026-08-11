import { BookingStatus, BookingTypes, PaymentMethod, PaymentStatus } from '../types/booking.types';

export type BookingTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: 'Confirmada',
  PENDING: 'Pendiente',
  HOLD: 'En espera',
  CANCELED: 'Cancelada',
  REJECTED: 'Rechazada',
  VALIDATING: 'Validando'
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  FAILED: 'Fallido',
  CANCELED: 'Cancelado',
  VALIDATING: 'Validando'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'Tarjeta',
  CASH: 'Efectivo',
  SPEI: 'Transferencia SPEI',
  PAYPAL: 'PayPal',
  DEFERRED: 'Pagos diferidos'
};

export const BOOKING_TYPE_LABELS: Record<BookingTypes, string> = {
  FLIGHT: 'Vuelo',
  HOTEL: 'Hotel',
  TRANSPORTATION: 'Traslado',
  ACTIVITY: 'Actividad',
  CAR_RENTAL: 'Renta de auto',
  CRUISE: 'Crucero',
  PACKAGE: 'Paquete'
};

export function getBookingStatusLabel(value: BookingStatus | string | null | undefined): string {
  const key = (value || '').toUpperCase() as BookingStatus;
  return BOOKING_STATUS_LABELS[key] ?? 'Desconocido';
}

export function getPaymentStatusLabel(value: PaymentStatus | string | null | undefined): string {
  const key = (value || '').toUpperCase() as PaymentStatus;
  return PAYMENT_STATUS_LABELS[key] ?? 'Desconocido';
}

export function getPaymentMethodLabel(value: PaymentMethod | string | null | undefined): string {
  const key = (value || '').toUpperCase() as PaymentMethod;
  return PAYMENT_METHOD_LABELS[key] ?? 'Otro';
}

export function getBookingTypeLabel(value: BookingTypes | string | null | undefined): string {
  const key = (value || '').toUpperCase() as BookingTypes;
  return BOOKING_TYPE_LABELS[key] ?? 'Reservación';
}

export function getToneClass(tone: BookingTone): string {
  return `booking-badge booking-badge--${tone}`;
}

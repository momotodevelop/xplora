import { Injectable } from '@angular/core';
import { FirebaseBooking, ReservationLinkedService } from '../types/booking.types';
import {
  BookingTone,
  getBookingStatusLabel,
  getBookingTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel
} from '../utils/booking-display.utils';

export interface BookingPricingSummary {
  quotedTotal: number;
  confirmedTotal: number;
  amountPaid: number;
  balance: number;
}

export interface BookingTimelineItem {
  label: string;
  description: string;
  date: Date | null;
  tone: BookingTone;
}

export interface BookingItineraryItem {
  id: string;
  title: string;
  subtitle: string;
  typeLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  tone: BookingTone;
  amount?: number;
  reference?: string | null;
  notes?: string;
}

export interface BookingDisplaySummary {
  shortReference: string;
  typeLabel: string;
  serviceLabel: string;
  routeLabel: string;
  travelerName: string;
  bookingStatusLabel: string;
  paymentStatusLabel: string;
  paymentMethodLabel: string;
  lifecycleLabel: string;
  bookingTone: BookingTone;
  paymentTone: BookingTone;
  lifecycleTone: BookingTone;
  pricing: BookingPricingSummary;
  paymentDeadline: Date | null;
  hasOutstandingBalance: boolean;
  canPay: boolean;
  headline: string;
  publicMessage: string;
  adminMessage: string;
  nextStep: string;
  transparencyNote: string;
  customerNextStep: string;
  customerNote: string;
  supplierReference: string | null;
  timeline: BookingTimelineItem[];
  customerTimeline: BookingTimelineItem[];
  itinerary: BookingItineraryItem[];
}

@Injectable({
  providedIn: 'root'
})
export class BookingDisplayService {
  buildSummary(booking: FirebaseBooking): BookingDisplaySummary {
    const quotedTotal = booking.payment?.originalAmount ?? booking.payment?.totalDue ?? booking.payment?.amount ?? 0;
    const confirmedTotal = booking.payment?.totalDue ?? booking.payment?.amount ?? quotedTotal;
    const amountPaid = Math.max(booking.payment?.payed ?? 0, 0);
    const balance = Math.max(confirmedTotal - amountPaid, 0);
    const bookingStatusLabel = getBookingStatusLabel(booking.status);
    const paymentStatusLabel = getPaymentStatusLabel(this.getEffectivePaymentStatus(booking, balance));
    const paymentMethodLabel = getPaymentMethodLabel(booking.payment?.method);
    const paymentDeadline = this.toDate(booking.payment?.paymentLimit);
    const travelerName = [booking.contact?.name, booking.contact?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Cliente sin identificar';
    const typeLabel = getBookingTypeLabel(booking.type);
    const shortReference = booking.bookingID?.slice(-6).toUpperCase() ?? 'N/D';
    const serviceLabel = this.getServiceLabel(booking);
    const routeLabel = this.getRouteLabel(booking);
    const hasOutstandingBalance = balance > 0.01;
    const canPay = hasOutstandingBalance && !['CANCELED', 'REJECTED'].includes(booking.status);
    const lifecycleTone = this.getLifecycleTone(booking, hasOutstandingBalance);
    const lifecycleLabel = this.getLifecycleLabel(booking, hasOutstandingBalance);

    return {
      shortReference,
      typeLabel,
      serviceLabel,
      routeLabel,
      travelerName,
      bookingStatusLabel,
      paymentStatusLabel,
      paymentMethodLabel,
      lifecycleLabel,
      bookingTone: this.getBookingTone(booking.status),
      paymentTone: this.getPaymentTone(booking, hasOutstandingBalance),
      lifecycleTone,
      pricing: {
        quotedTotal,
        confirmedTotal,
        amountPaid,
        balance
      },
      paymentDeadline,
      hasOutstandingBalance,
      canPay,
      headline: this.getHeadline(booking, hasOutstandingBalance),
      publicMessage: this.getPublicMessage(booking, hasOutstandingBalance, paymentDeadline),
      adminMessage: this.getAdminMessage(booking, hasOutstandingBalance, paymentDeadline),
      nextStep: this.getNextStep(booking, hasOutstandingBalance, paymentDeadline),
      transparencyNote: this.getTransparencyNote(quotedTotal, confirmedTotal, amountPaid, booking, hasOutstandingBalance),
      customerNextStep: this.getCustomerNextStep(booking, hasOutstandingBalance, paymentDeadline),
      customerNote: this.getCustomerNote(quotedTotal, confirmedTotal, amountPaid, booking, hasOutstandingBalance),
      supplierReference: booking.pnr ?? null,
      timeline: this.buildTimeline(booking, hasOutstandingBalance, paymentDeadline),
      customerTimeline: this.buildCustomerTimeline(booking, hasOutstandingBalance, paymentDeadline),
      itinerary: this.buildItinerary(booking)
    };
  }

  private hasPendingIdentityVerification(booking: FirebaseBooking): boolean {
    return Boolean(this.getKycUrl(booking)) && (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING');
  }

  private getKycUrl(booking: FirebaseBooking): string | null {
    return booking.payment?.flowCheckout?.kyc?.url || null;
  }

  private getEffectivePaymentStatus(booking: FirebaseBooking, hasOutstandingBalance: number): string {
    if (booking.payment?.status) {
      return booking.payment.status;
    }

    return hasOutstandingBalance > 0 ? 'PENDING' : 'COMPLETED';
  }

  private getServiceLabel(booking: FirebaseBooking): string {
    if (booking.type === 'FLIGHT') {
      return booking.flightDetails?.round ? 'Vuelo redondo' : 'Vuelo sencillo';
    }

    if (booking.type === 'HOTEL') {
      return 'Hospedaje';
    }

    return getBookingTypeLabel(booking.type);
  }

  private getRouteLabel(booking: FirebaseBooking): string {
    if (booking.type === 'FLIGHT' && booking.flightDetails) {
      const origin = booking.flightDetails.origin?.iataCode || booking.flightDetails.origin?.address?.cityName || 'Origen';
      const destination = booking.flightDetails.destination?.iataCode || booking.flightDetails.destination?.address?.cityName || 'Destino';
      return `${origin} -> ${destination}`;
    }

    if (booking.type === 'HOTEL' && booking.hotelDetails) {
      const hotel = booking.hotelDetails.hotel?.name || 'Hotel';
      const city = booking.hotelDetails.hotel?.city ? `, ${booking.hotelDetails.hotel.city}` : '';
      return `${hotel}${city}`;
    }

    return getBookingTypeLabel(booking.type);
  }

  private getHeadline(booking: FirebaseBooking, hasOutstandingBalance: boolean): string {
    if (booking.status === 'CANCELED') {
      return 'Tu reservación fue cancelada';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'La preaprobación del plan fue retirada';
    }

    if (booking.status === 'REJECTED') {
      return 'Tu reservación no pudo confirmarse';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Tu plan de pagos fue preaprobado';
    }

    if (['PREAPPROVED', 'PENDING_APPROVAL'].includes(booking.payment?.deferredPlan?.status ?? '')) {
      return 'Tu plan de pagos está activo';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Tu pago fue recibido y falta validar tu identidad';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Estamos validando tu pago';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      return 'Tu reservación está apartada, pero falta completar el pago';
    }

    if (booking.status === 'PENDING') {
      return 'Tu solicitud fue recibida y está pendiente de confirmación';
    }

    if (booking.status === 'HOLD') {
      return 'Tu reservación está en espera';
    }

    return 'Tu reservación está confirmada';
  }

  private getLifecycleLabel(booking: FirebaseBooking, hasOutstandingBalance: boolean): string {
    if (booking.status === 'CANCELED' || booking.status === 'REJECTED' || booking.status === 'HOLD') {
      return getBookingStatusLabel(booking.status);
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Pago en validación';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Plan preaprobado';
    }

    if (['PREAPPROVED', 'PENDING_APPROVAL'].includes(booking.payment?.deferredPlan?.status ?? '')) {
      return hasOutstandingBalance ? 'Plan activo' : 'Plan liquidado';
    }

    if (booking.payment?.deferredPlan?.status === 'APPROVED') {
      return hasOutstandingBalance ? 'Plan aprobado' : 'Plan liquidado';
    }

    if (booking.payment?.deferredPlan?.status === 'ACTIVE') {
      return hasOutstandingBalance ? 'Plan activo' : 'Plan liquidado';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      return 'Pendiente de pago';
    }

    if (booking.status === 'PENDING') {
      return 'Pendiente de confirmación';
    }

    if (booking.status === 'CONFIRMED' && hasOutstandingBalance) {
      return 'Confirmada con saldo pendiente';
    }

    return getBookingStatusLabel(booking.status);
  }

  private getPublicMessage(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): string {
    if (booking.status === 'CANCELED') {
      return 'La reservación ya no se encuentra activa. Si aplica un reembolso o reacomodo, se dará seguimiento por nuestros canales de atención.';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'La agencia retiró la preaprobación del plan. El anticipo recibido será reembolsado en su totalidad y la reservación asociada fue cancelada.';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Tu calendario quedó guardado y preaprobado. Cubre el anticipo para activar el plan.';
    }

    if (booking.payment?.method === 'DEFERRED' && hasOutstandingBalance) {
      return 'Tu plan muestra cada fecha, abono y saldo pendiente. El total debe quedar liquidado siete días antes del inicio del viaje.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Recibimos tu pago, pero falta concluir la validación de identidad para confirmar la reservación. No realices un segundo pago.';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Recibimos tu intento de pago y lo estamos validando. No realices un segundo pago hasta recibir confirmación.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      const deadlineLabel = paymentDeadline ? ` antes del ${paymentDeadline.toLocaleString('es-MX')}` : '';
      return `La tarifa y la disponibilidad siguen sujetas a pago y confirmación final. Completa el pago${deadlineLabel} para conservar la compra.`;
    }

    if (booking.status === 'PENDING') {
      return 'El pago ya fue registrado, pero la confirmación final todavía depende del proveedor o de una validación interna.';
    }

    if (booking.status === 'CONFIRMED') {
      return 'La información mostrada aquí corresponde al estado confirmado de tu compra en Xplora Travel.';
    }

    return 'Consulta los detalles de tu compra y, si notas algo incorrecto, contáctanos para revisarlo.';
  }

  private getAdminMessage(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): string {
    if (booking.status === 'CANCELED') {
      return 'Caso cerrado o en seguimiento de cancelación. Verificar si existe reembolso, crédito o reacomodo pendiente.';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'Preaprobación retirada. Confirmar el reembolso total de cualquier anticipo recibido y comunicarlo al cliente.';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Plan preaprobado pendiente de anticipo. Verificar la aplicación de fondos para continuar el seguimiento.';
    }

    if (booking.payment?.method === 'DEFERRED' && hasOutstandingBalance) {
      return 'Plan activo con saldo pendiente. Dar seguimiento a las parcialidades y comprobantes conforme al calendario.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Pago recibido. Falta que el cliente complete KYC antes de cerrar la validación y confirmar la reservación.';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'No ejecutar un nuevo cobro hasta cerrar la validación manual del pago.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      const deadlineLabel = paymentDeadline ? ` antes del ${paymentDeadline.toLocaleString('es-MX')}` : '';
      return `Pendiente de cobro. Confirmar con el cliente la cobertura total${deadlineLabel} y evitar que la tarifa caduque.`;
    }

    if (booking.status === 'PENDING') {
      return 'Pago cubierto; falta confirmación de proveedor o actualización operativa para el cliente.';
    }

    if (booking.status === 'CONFIRMED' && hasOutstandingBalance) {
      return 'La reservación ya aparece como confirmada, pero todavía existe saldo pendiente. Revisar conciliación y comunicación con cliente.';
    }

    return 'La reservación ya refleja un estado operativo consistente para seguimiento y postventa.';
  }

  private getNextStep(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): string {
    if (booking.status === 'CANCELED') {
      return 'Confirmar con el cliente si procede reembolso, crédito o nueva cotización.';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'Completar y documentar el reembolso total del anticipo recibido.';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Dar seguimiento al anticipo; el plan se activa cuando los fondos queden aplicados.';
    }

    if (booking.payment?.method === 'DEFERRED' && hasOutstandingBalance) {
      return 'Dar seguimiento al próximo abono programado del plan.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Dar seguimiento a la validación de identidad del cliente y confirmar la reservación en cuanto el caso quede resuelto.';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Esperar el resultado de validación y comunicar al cliente en cuanto el caso quede resuelto.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      if (paymentDeadline) {
        return `Completar el pago antes del ${paymentDeadline.toLocaleString('es-MX')} para mantener la tarifa y disponibilidad.`;
      }

      return 'Completar el pago para poder confirmar la reservación.';
    }

    if (booking.status === 'PENDING') {
      return 'Esperar o gestionar la confirmación del proveedor y avisar al cliente en cuanto cambie el estado.';
    }

    if (booking.status === 'CONFIRMED') {
      return 'Compartir confirmación, documentos y próximos pasos del viaje.';
    }

    return 'Dar seguimiento operativo según el caso.';
  }

  private getTransparencyNote(
    quotedTotal: number,
    confirmedTotal: number,
    amountPaid: number,
    booking: FirebaseBooking,
    hasOutstandingBalance: boolean
  ): string {
    if (Math.abs(quotedTotal - confirmedTotal) > 0.01) {
      return 'El total confirmado no coincide con el importe cotizado originalmente. Conviene explicar claramente el ajuste al cliente.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      return 'La compra todavía no debe comunicarse como cerrada; la tarifa y disponibilidad siguen sujetas a pago y confirmación.';
    }

    if (amountPaid > 0 && hasOutstandingBalance) {
      return 'Existe un pago parcial o un saldo no cubierto. El cliente debe ver el saldo pendiente con claridad.';
    }

    return 'La vista debe mostrar el total confirmado, lo pagado y el saldo pendiente sin ambiguedades.';
  }

  private getCustomerNextStep(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): string {
    if (booking.status === 'CANCELED') {
      return 'Si necesitas apoyo con reembolso, cambios o una nueva cotización, contáctanos y te ayudaremos.';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'La agencia dará seguimiento al reembolso total del anticipo recibido.';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Realiza el anticipo indicado para activar tu plan preaprobado.';
    }

    if (booking.payment?.method === 'DEFERRED' && hasOutstandingBalance) {
      return 'Consulta tu calendario y realiza cada abono en efectivo o por transferencia antes de su fecha límite.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Completa tu validación de identidad para que podamos confirmar tu reservación.';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Te notificaremos en cuanto tu pago quede validado y el estado de tu compra se actualice.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      if (paymentDeadline) {
        return `Completa el pago antes del ${paymentDeadline.toLocaleString('es-MX')} para conservar tu tarifa y disponibilidad.`;
      }

      return 'Completa el pago para continuar con la confirmación final de tu reservación.';
    }

    if (booking.status === 'PENDING') {
      return 'Tu compra está en proceso de confirmación. Te avisaremos cuando el proveedor la deje lista.';
    }

    if (booking.status === 'CONFIRMED') {
      return 'Revisa tus documentos, confirma tus datos y conserva esta referencia para cualquier soporte.';
    }

    return 'Consulta aquí el estado actualizado de tu compra y los siguientes pasos.';
  }

  private getCustomerNote(
    quotedTotal: number,
    confirmedTotal: number,
    amountPaid: number,
    booking: FirebaseBooking,
    hasOutstandingBalance: boolean
  ): string {
    if (Math.abs(quotedTotal - confirmedTotal) > 0.01) {
      return 'Aquí ves el monto final confirmado de tu compra, incluso si cambió respecto a la cotización inicial.';
    }

    if (booking.payment?.method === 'DEFERRED') {
      return 'Los comprobantes aparecen primero en validación. El saldo disminuye cuando la agencia confirma que el abono fue recibido.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Tu pago ya fue recibido. Lo único pendiente es completar la validación de identidad para continuar con la confirmación.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      return 'La tarifa y la disponibilidad siguen sujetas a confirmación hasta completar el pago.';
    }

    if (amountPaid > 0 && hasOutstandingBalance) {
      return 'Tu pago parcial ya fue registrado. Aquí puedes consultar lo pagado y el saldo pendiente.';
    }

    return 'Aquí puedes revisar con claridad el total confirmado, lo pagado y cualquier saldo pendiente.';
  }

  private buildTimeline(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): BookingTimelineItem[] {
    const timeline: BookingTimelineItem[] = [
      {
        label: 'Reserva creada',
        description: `Se generó la reservación ${booking.bookingID?.slice(-6).toUpperCase() ?? ''}.`,
        date: this.toDate(booking.created),
        tone: 'neutral'
      }
    ];

    if (hasOutstandingBalance && paymentDeadline) {
      timeline.push({
        label: 'Límite de pago',
        description: 'Si no se cubre el saldo antes de este momento, la tarifa o la disponibilidad pueden perderse.',
        date: paymentDeadline,
        tone: 'warning'
      });
    }

    if (this.hasPendingIdentityVerification(booking)) {
      timeline.push({
        label: 'Validación de identidad requerida',
        description: 'El pago ya fue recibido, pero falta concluir el proceso KYC del cliente.',
        date: null,
        tone: 'info'
      });
    } else if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      timeline.push({
        label: 'Pago en validación',
        description: 'Existe una revisión manual o antifraude en curso.',
        date: null,
        tone: 'info'
      });
    }

    timeline.push({
      label: 'Estado actual',
      description: this.getLifecycleLabel(booking, hasOutstandingBalance),
      date: null,
      tone: this.getLifecycleTone(booking, hasOutstandingBalance)
    });

    if (booking.pnr) {
      timeline.push({
        label: 'Referencia de proveedor',
        description: `PNR o localizador externo: ${booking.pnr}.`,
        date: null,
        tone: 'success'
      });
    }

    return timeline;
  }

  private buildCustomerTimeline(booking: FirebaseBooking, hasOutstandingBalance: boolean, paymentDeadline: Date | null): BookingTimelineItem[] {
    const timeline: BookingTimelineItem[] = [
      {
        label: 'Reserva creada',
        description: `Recibimos tu reservación ${booking.bookingID?.slice(-6).toUpperCase() ?? ''}.`,
        date: this.toDate(booking.created),
        tone: 'neutral'
      }
    ];

    if (hasOutstandingBalance && paymentDeadline) {
      timeline.push({
        label: 'Límite de pago',
        description: 'Completa tu pago antes de esta fecha para conservar la tarifa y la disponibilidad.',
        date: paymentDeadline,
        tone: 'warning'
      });
    }

    if (this.hasPendingIdentityVerification(booking)) {
      timeline.push({
        label: 'Validación de identidad',
        description: 'Necesitamos que completes tu verificación de identidad para continuar con la confirmación.',
        date: null,
        tone: 'info'
      });
    } else if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      timeline.push({
        label: 'Pago en revisión',
        description: 'Estamos revisando tu pago y te notificaremos cuando quede validado.',
        date: null,
        tone: 'info'
      });
    }

    timeline.push({
      label: 'Estado actual',
      description: this.getCustomerTimelineStatusDescription(booking, hasOutstandingBalance),
      date: null,
      tone: this.getLifecycleTone(booking, hasOutstandingBalance)
    });

    if (booking.pnr) {
      timeline.push({
        label: 'Referencia de viaje',
        description: `Tu referencia es ${booking.pnr}.`,
        date: null,
        tone: 'success'
      });
    }

    return timeline;
  }

  private getCustomerTimelineStatusDescription(booking: FirebaseBooking, hasOutstandingBalance: boolean): string {
    if (booking.status === 'CANCELED') {
      return 'La reservación ya no está activa. Si necesitas ayuda, nuestro equipo puede orientarte sobre los siguientes pasos.';
    }

    if (booking.payment?.deferredPlan?.status === 'REJECTED') {
      return 'La preaprobación fue retirada. La reservación se canceló y cualquier anticipo recibido deberá reembolsarse en su totalidad.';
    }

    if (this.isDeferredPlanAwaitingDownPayment(booking)) {
      return 'Tu calendario está preaprobado y únicamente espera la aplicación del anticipo para activarse.';
    }

    if (booking.payment?.method === 'DEFERRED' && hasOutstandingBalance) {
      return 'Tu plan está activo. Consulta el calendario y realiza los abonos antes de cada fecha límite.';
    }

    if (this.hasPendingIdentityVerification(booking)) {
      return 'Tu pago ya fue recibido, pero falta completar tu validación de identidad para confirmar la compra.';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'Tu pago sigue en revisión. No realices un segundo pago mientras termina la validación.';
    }

    if (booking.status === 'PENDING' && hasOutstandingBalance) {
      return 'Tu compra sigue apartada y falta completar el pago para continuar con la confirmación.';
    }

    if (booking.status === 'PENDING') {
      return 'Tu compra ya fue recibida y está en proceso de confirmación.';
    }

    if (booking.status === 'CONFIRMED' && hasOutstandingBalance) {
      return 'Tu compra está confirmada y aquí puedes revisar el saldo pendiente.';
    }

    if (booking.status === 'CONFIRMED') {
      return 'Tu compra está confirmada.';
    }

    if (booking.status === 'HOLD') {
      return 'Tu reservación está en espera. Te avisaremos si hay una actualización importante.';
    }

    return 'Aquí puedes revisar el estado más reciente de tu compra.';
  }

  private buildItinerary(booking: FirebaseBooking): BookingItineraryItem[] {
    const items: BookingItineraryItem[] = [];

    if (booking.type === 'FLIGHT' && booking.flightDetails) {
      items.push({
        id: 'primary-flight',
        title: booking.flightDetails.round ? 'Vuelo redondo principal' : 'Vuelo principal',
        subtitle: this.getRouteLabel(booking),
        typeLabel: 'Vuelo',
        startDate: this.toDate(booking.flightDetails.departure),
        endDate: this.toDate(booking.flightDetails.return),
        tone: this.getBookingTone(booking.status),
        amount: booking.payment?.totalDue ?? booking.payment?.amount ?? undefined,
        reference: booking.pnr ?? null
      });
    }

    if (booking.type === 'HOTEL' && booking.hotelDetails) {
      items.push({
        id: 'primary-hotel',
        title: booking.hotelDetails.hotel?.name || 'Hotel principal',
        subtitle: `${booking.hotelDetails.hotel?.city || ''}${booking.hotelDetails.hotel?.country ? ', ' + booking.hotelDetails.hotel.country : ''}`.trim(),
        typeLabel: 'Hotel',
        startDate: this.toDate(booking.hotelDetails.checkin),
        endDate: this.toDate(booking.hotelDetails.checkout),
        tone: this.getBookingTone(booking.status),
        amount: booking.payment?.totalDue ?? booking.payment?.amount ?? undefined,
        reference: booking.pnr ?? null
      });
    }

    for (const service of booking.linkedServices ?? []) {
      items.push(this.buildLinkedServiceItem(service));
    }

    return items.sort((left, right) => {
      const a = left.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const b = right.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return a - b;
    });
  }

  private isDeferredPlanAwaitingDownPayment(booking: FirebaseBooking): boolean {
    const plan = booking.payment?.deferredPlan;
    return !!plan
      && ['PREAPPROVED', 'PENDING_APPROVAL'].includes(plan.status)
      && (booking.payment?.payed ?? 0) < plan.downPaymentAmount;
  }

  private buildLinkedServiceItem(service: ReservationLinkedService): BookingItineraryItem {
    return {
      id: service.id,
      title: service.title || 'Servicio adicional',
      subtitle: [service.origin, service.destination].filter(Boolean).join(' -> ') || service.location || service.provider || 'Servicio manual',
      typeLabel: this.getLinkedServiceTypeLabel(service.type),
      startDate: this.toDate(service.startDate),
      endDate: this.toDate(service.endDate),
      tone: service.included ? 'success' : 'neutral',
      amount: service.amount,
      reference: service.reference ?? null,
      notes: service.notes
    };
  }

  private getLinkedServiceTypeLabel(type: ReservationLinkedService['type']): string {
    switch (type) {
      case 'FLIGHT':
        return 'Vuelo';
      case 'HOTEL':
        return 'Hotel';
      case 'TRANSPORTATION':
        return 'Traslado';
      case 'ACTIVITY':
        return 'Actividad';
      case 'PACKAGE':
        return 'Paquete';
      case 'INSURANCE':
        return 'Seguro';
      case 'BAGGAGE':
        return 'Equipaje';
      case 'SEAT':
        return 'Asiento';
      default:
        return 'Extra';
    }
  }

  private getBookingTone(status: FirebaseBooking['status']): BookingTone {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'VALIDATING':
        return 'info';
      case 'PENDING':
      case 'HOLD':
        return 'warning';
      case 'CANCELED':
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private getPaymentTone(booking: FirebaseBooking, hasOutstandingBalance: boolean): BookingTone {
    if (booking.payment?.status === 'VALIDATING') {
      return 'info';
    }

    if (booking.payment?.status === 'FAILED' || booking.payment?.status === 'CANCELED') {
      return 'danger';
    }

    if (hasOutstandingBalance) {
      return 'warning';
    }

    return 'success';
  }

  private getLifecycleTone(booking: FirebaseBooking, hasOutstandingBalance: boolean): BookingTone {
    if (booking.status === 'CANCELED' || booking.status === 'REJECTED') {
      return 'danger';
    }

    if (booking.status === 'VALIDATING' || booking.payment?.status === 'VALIDATING') {
      return 'info';
    }

    if (booking.status === 'PENDING' || booking.status === 'HOLD' || hasOutstandingBalance) {
      return 'warning';
    }

    return 'success';
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
  }
}

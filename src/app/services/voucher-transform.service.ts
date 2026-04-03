// voucher-transform.service.ts
import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FirebaseBooking } from '../types/booking.types';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FlightOffer, Segment } from '../types/flight-offer-amadeus.types';
import { PaymentMethodPipe } from '../payment-method.pipe';

// Ajusta esta ruta a donde tengas definido tu FirebaseBooking
// p.ej.: import { FirebaseBooking } from '../types/firebase-booking.types';

export interface VoucherPassenger {
  id: number | string;
  name: string;
  type?: string;
  gender?: string;
}

export interface ServicePassengerRef {
  passengerId: number | string;
  name: string;
  type?: string;
  seat?: string | null;
}

export interface SegmentEndpoint {
  date: string | null;
  time: string | null;
  iata: string;
  terminal?: string;
}

export interface FlightSegmentPrintable {
  departure: SegmentEndpoint;
  arrival: SegmentEndpoint;
  carrier: string;
  flightNumber: string;
  duration?: string;
}

export interface ServiceDateTime {
  date: string | null;
  time: string | null;
}

export interface ServicePrintable {
  id?: string;
  serviceType: string;        // "FLIGHT" | "HOTEL" | "PACKAGE" | ...
  label: string;
  provider?: string;
  origin?: string;
  destination?: string;
  start?: ServiceDateTime;
  end?: ServiceDateTime;
  segments: FlightSegmentPrintable[];
  bookedFor: ServicePassengerRef[];
  meta?: Record<string, any>;
}

export interface ChargeLine {
  description: string;
  amount: string;
  aditional_info?: string[];
}

export interface PaymentPrintable {
  method?: string;
  status?: string;
  amount?: string;
  totalDue?: string;
  paid?: string;
  originalAmount?: string;
  paymentLimit?: string;
}

export interface ContactPrintable {
  name?: string;
  lastname?: string;
  email?: string;
  phone?: string;
}

export interface VoucherPrintable {
  voucherNumber: number;          // timestamp (ms) al generar el voucher
  locator: number | null;         // timestamp (ms) de creación del booking
  pnr: string;                    // últimos 6 del bookingId, uppercase
  bookingId: string;
  type?: string;
  status?: string;
  createdAt?: number | null;
  payment: PaymentPrintable;
  contact: ContactPrintable;
  passengers: VoucherPassenger[];
  services: ServicePrintable[];
  charges: {
    breakdown: ChargeLine[];
    totalAmount: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VoucherTransformService {

  constructor(private datePipe: DatePipe, private currency: CurrencyPipe, private titlecase: TitleCasePipe, private paymentMethodPipe: PaymentMethodPipe) { }

  // ========= API pública =========

  /**
   * Transforma un FirebaseBooking (FLIGHT por ahora) a un objeto
   * universal listo para alimentar el template del voucher.
   */
  transformFirebaseBookingToVoucher(raw: FirebaseBooking): VoucherPrintable {
    const nowMillis = Date.now();

    const bookingId = this.safe(raw.bookingID ?? '', '');
    const status = this.safe(raw.status, '');
    const type = this.safe(raw.type, 'UNKNOWN');

    // pnr: últimos 6 caracteres en mayúsculas
    const pnr = bookingId ? String(bookingId).slice(-6).toUpperCase() : '';

    // locator y createdAt en ms
    const createdMillis = raw.created?.toDate().getTime() ?? new Date().getTime();
    const locator = createdMillis;

    // Pasajeros
    const { passengers, rawPassengers } = this.buildPassengers(raw);

    // Asientos por segmento
    const seatRefsBySegment = this.buildSeatMapBySegment(raw);
    this.attachPassengerNamesToSeats(seatRefsBySegment, rawPassengers);

    // Servicios (por ahora solo vuelos; se puede extender a hotel/paquete)
    const services: ServicePrintable[] = [
      ...this.buildFlightServices(raw, passengers, seatRefsBySegment)
    ];

    // Cargos / totales
    const { breakdown, totalAmount } = this.buildCharges(raw);

    // Pago / contacto
    const payment = this.buildPayment(raw, totalAmount);
    const contact = this.buildContact(raw);

    const voucher: VoucherPrintable = {
      voucherNumber: nowMillis,
      locator,
      pnr,
      bookingId,
      type,
      status,
      createdAt: createdMillis,
      payment,
      contact,
      passengers,
      services,
      charges: {
        breakdown,
        totalAmount: this.currency.transform(totalAmount, 'MXN', 'symbol', '1.2-2')!
      }
    };

    return voucher;
  }

  // ========= Helpers genéricos =========

  private safe<T>(val: any, fallback: T): T {
    return val == null ? fallback : val;
  }

  // ========= Construcción de secciones =========

  private buildPassengers(raw: FirebaseBooking): { passengers: VoucherPassenger[]; rawPassengers: any[] } {
    const rawPassengers = (raw.flightDetails?.passengers?.details ?? []) as any[];

    const passengers: VoucherPassenger[] = rawPassengers.map((p, index) => {
      const name = `${this.safe(p.name, '').toString().trim()} ${this.safe(p.lastname, '').toString().trim()}`.trim();
      const id = this.safe(p.id ?? index + 1, index + 1);

      return {
        id,
        name: this.titlecase.transform(name || this.safe(p.fullName, '')),
        type: p.type,
        gender: p.gender
      };
    });

    return { passengers, rawPassengers };
  }

  /** seatMaps -> segmentId => [{ passengerId, seat }] */
  private buildSeatMapBySegment(raw: FirebaseBooking): Record<string, ServicePassengerRef[]> {
    const seatMaps = raw.flightDetails?.seatMaps ?? [];
    const result: Record<string, ServicePassengerRef[]> = {};

    for (const map of seatMaps as any[]) {
      const segmentKey = String(map.segmentId ?? map.id ?? '');
      if (!segmentKey) continue;

      const selected = map.selectedSeats ?? [];
      if (!Array.isArray(selected)) continue;

      result[segmentKey] = selected.map((s: any) => {
        const passengerIndex = s.passengerID ?? s.travelerId ?? null;
        const seatNumber = s.seat?.number ?? null;

        return {
          passengerId: passengerIndex,
          name: '',
          type: undefined,
          seat: seatNumber
        };
      });
    }

    return result;
  }

  /** Rellena nombre/tipo usando el arreglo crudo de pasajeros */
  private attachPassengerNamesToSeats(
    seatRefsBySegment: Record<string, ServicePassengerRef[]>,
    rawPassengers: any[]
  ): void {
    Object.keys(seatRefsBySegment).forEach(segId => {
      const refs = seatRefsBySegment[segId];
      seatRefsBySegment[segId] = refs.map(ref => {
        let idx: number | null = null;

        if (typeof ref.passengerId === 'number') {
          idx = ref.passengerId;
        } else {
          const num = Number(ref.passengerId);
          if (!Number.isNaN(num)) idx = num;
        }

        const passengerFromRaw = idx != null ? rawPassengers[idx] : null;

        const fullName = passengerFromRaw
          ? `${this.safe(passengerFromRaw.name, '').toString().trim()} ${this.safe(passengerFromRaw.lastname, '').toString().trim()}`.trim()
          : '';

        const type = passengerFromRaw?.type;

        return {
          ...ref,
          name: this.titlecase.transform(fullName || ref.name),
          type: type ?? ref.type
        };
      });
    });
  }

  /** Construye services de tipo FLIGHT con segments + bookedFor */
  private buildFlightServices(
    raw: FirebaseBooking,
    passengers: VoucherPassenger[],
    seatRefsBySegment: Record<string, ServicePassengerRef[]>
  ): ServicePrintable[] {
    const services: ServicePrintable[] = [];
    const fd = raw.flightDetails;
    if (!fd || !fd.flights) return services;

    const outboundOffer = (fd.flights as any).outbound?.offer ?? (fd.flights as any).outbound;
    const inboundOffer  = (fd.flights as any).inbound?.offer  ?? (fd.flights as any).inbound;

    const originIata = fd.origin?.iataCode ?? outboundOffer?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode;
    const destIata   = fd.destination?.iataCode ?? outboundOffer?.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode;

    const originCity = fd.origin?.address?.cityName ?? (fd.origin as any)?.cityName ?? '';
    const destCity   = fd.destination?.address?.cityName ?? (fd.destination as any)?.cityName ?? '';

    const originLabel = originIata ? `${originIata} - ${originCity}`.trim() : originCity;
    const destLabel   = destIata   ? `${destIata} - ${destCity}`.trim()   : destCity;

    const getCarrierCode = (seg: Segment, offer: FlightOffer): string =>
      (seg?.carrierCode ?? seg?.operating?.carrierCode ?? offer?.validatingAirlineCodes?.[0] ?? '').toString();

    const buildBookedFor = (firstSegmentId: any): ServicePassengerRef[] => {
      const segKey = firstSegmentId != null ? String(firstSegmentId) : '';
      const seatRefs = seatRefsBySegment[segKey] ?? [];

      return passengers.map((p, index) => {
        const seatRef = seatRefs.find(ref => {
          const num = typeof ref.passengerId === 'number' ? ref.passengerId : Number(ref.passengerId);
          return num === index;
        });

        return {
          passengerId: p.id,
          name: p.name,
          type: p.type,
          seat: seatRef?.seat ?? null
        };
      });
    };

    const buildServiceFromOffer = (offer: FlightOffer, direction: 'OUTBOUND' | 'INBOUND'): ServicePrintable | null => {
      if (!offer || !offer.itineraries?.[0]?.segments?.length) return null;

      const segments = offer.itineraries[0].segments;
      const firstSeg = segments[0];
      const lastSeg  = segments[segments.length - 1];

      const carrierCode = getCarrierCode(firstSeg, offer);
      const label =
        direction === 'OUTBOUND'
          ? (originIata && destIata ? `Vuelo ${originIata} → ${destIata}` : 'Vuelo (ida)')
          : (originIata && destIata ? `Vuelo ${destIata} → ${originIata}` : 'Vuelo (regreso)');

      const printableSegments: FlightSegmentPrintable[] = segments.map(seg => {
        const cCode = getCarrierCode(seg, offer);
        return {
          departure: {
            date: this.datePipe.transform(seg.departure?.at, 'shortDate'),
            time: this.datePipe.transform(seg.departure?.at, 'shortTime'),
            iata: seg.departure?.iataCode ?? '',
            terminal: seg.departure?.terminal
          },
          arrival: {
            date: this.datePipe.transform(seg.arrival?.at, 'shortDate'),
            time: this.datePipe.transform(seg.arrival?.at, 'shortTime'),
            iata: seg.arrival?.iataCode ?? '',
            terminal: seg.arrival?.terminal
          },
          carrier: cCode,
          flightNumber: `${cCode} ${seg.number ?? ''}`.trim(),
          duration: seg.duration
        };
      });

      const firstSegmentId = firstSeg.id;

      const service: ServicePrintable = {
        id: String(firstSegmentId ?? direction),
        serviceType: 'FLIGHT',
        label,

        provider: carrierCode || 'AEROLINEA',
        origin: direction === 'OUTBOUND' ? originLabel || 'Origen' : destLabel || 'Origen',
        destination: direction === 'OUTBOUND' ? destLabel || 'Destino' : originLabel || 'Destino',
        start: {
          date: this.datePipe.transform(firstSeg.departure?.at, 'shortDate'),
          time: this.datePipe.transform(firstSeg.departure?.at, 'shortTime')
        },
        end:   {
          date: this.datePipe.transform(lastSeg.arrival?.at, 'shortDate'),
          time: this.datePipe.transform(lastSeg.arrival?.at, 'shortTime')
        },
        segments: printableSegments,
        bookedFor: buildBookedFor(firstSegmentId),
        meta: {
          direction,
          cabin: offer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin,
          duration: offer.itineraries[0].duration,
          validatingAirline: offer?.validatingAirlineCodes?.[0]
        }
      };

      return service;
    };

    const outboundService = buildServiceFromOffer(outboundOffer, 'OUTBOUND');
    const inboundService  = buildServiceFromOffer(inboundOffer,  'INBOUND');

    if (outboundService) services.push(outboundService);
    if (inboundService)  services.push(inboundService);

    return services;
  }

  private buildCharges(raw: FirebaseBooking): { breakdown: ChargeLine[]; totalAmount: number } {
    const rawCharges = raw.charges ?? [];
    const breakdown: ChargeLine[] = rawCharges.map((c: any) => {
      const amt = Number(this.safe(c.amount ?? 0, 0));
      return {
        description: this.safe(c.description ?? '', ''),
        amount: this.currency.transform(amt, 'MXN', 'symbol', '1.2-2')!,
        aditional_info: c.aditional_info
      };
    });

    const totalFromPayment = raw.payment?.amount ?? raw.payment?.totalDue ?? raw.payment?.originalAmount ?? 0;
    const totalAmount = Number(totalFromPayment);

    return { breakdown, totalAmount };
  }

  private buildPayment(raw: FirebaseBooking, totalAmount: number): PaymentPrintable {
    const totalFromPayment = raw.payment?.amount ?? raw.payment?.totalDue ?? raw.payment?.originalAmount;
    const effectiveTotal = totalFromPayment != null ? Number(totalFromPayment) : totalAmount;

    return {
      method: this.paymentMethodPipe.transform(raw.payment?.method ?? 'OTHER'),
      status: raw.payment?.status ?? undefined,
      amount: this.currency.transform(effectiveTotal, 'MXN', 'symbol', '1.2-2')!,
      totalDue: this.currency.transform(raw.payment?.totalDue ?? 0, 'MXN', 'symbol', '1.2-2')!,
      paid: this.currency.transform(raw.payment?.payed ?? 0, 'MXN', 'symbol', '1.2-2')!,
      originalAmount: this.currency.transform(raw.payment?.originalAmount ?? 0, 'MXN', 'symbol', '1.2-2')!,
      paymentLimit: this.datePipe.transform(raw.payment?.paymentLimit?.toDate(), 'short')!
    };
  }

  private buildContact(raw: FirebaseBooking): ContactPrintable {
    const phone = raw.contact?.country_code
      ? `+${raw.contact.country_code} ${raw.contact.phone}`
      : raw.contact?.phone;

    return {
      name: this.titlecase.transform(raw.contact?.name?.trim() ?? '')!,
      lastname: this.titlecase.transform(raw.contact?.lastname?.trim() ?? '')!,
      email: raw.contact?.email ?? undefined,
      phone,
      
    };
  }
}

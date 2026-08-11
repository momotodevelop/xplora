import { DocumentReference, Timestamp } from "@angular/fire/firestore";
import { Charge } from "../pages/booking-process/booking-sidebar/booking-sidebar.component";
import { ContactInfoValue } from "../pages/booking-process/contact-info/contact-info.component";
import { ExtraBaggageData } from "../pages/booking-process/extras/add-carry-on/add-carry-on.component";
import { PassengerValue } from "../pages/booking-process/passengers/passengers.component";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { Promo } from "../services/xplora-promos.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
import { SeatMapSavingData } from "./amadeus-seat-map.types";
import { CancellationPolicies, Commission, Rate, RetailRate, RoomType, TaxesAndFees } from "./lite-api.types";
import { PayPalOrderCaptureResponse } from "../services/paypal.service";
import { PaymentErrorOutput } from "../services/payment-error.service";
import { CodigoPostalInfo } from "../services/copomex.service";

export type PaymentMethod = "CARD"|"CASH"|"SPEI"|"PAYPAL"|"DEFERRED";
export type PaymentType = "NOW"|"DELAYED";
export type BookingStatus = "CONFIRMED"|"PENDING"|"HOLD"|"CANCELED"|"REJECTED"|"VALIDATING";
export type BookingTypes = 'FLIGHT' | 'HOTEL' | 'TRANSPORTATION' | 'ACTIVITY' | 'CAR_RENTAL' | 'CRUISE' | 'PACKAGE' ;
export type ReservationServiceType = BookingTypes | 'INSURANCE' | 'BAGGAGE' | 'SEAT' | 'EXTRA';
export type DeferredPaymentFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type DeferredPaymentPlanStatus = 'PREAPPROVED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
export type DeferredPaymentInstallmentType = 'DOWN_PAYMENT' | 'INSTALLMENT';

export interface DeferredPaymentInstallment {
    id: string;
    number: number;
    type: DeferredPaymentInstallmentType;
    dueDate: Timestamp;
    amount: number;
    balanceAfter: number;
}

export interface DeferredPaymentPlan {
    id: string;
    status: DeferredPaymentPlanStatus;
    frequency: DeferredPaymentFrequency;
    purchaseAmount: number;
    downPaymentPercentage: number;
    downPaymentAmount: number;
    financedAmount: number;
    tripStartDate: Timestamp;
    payoffDate: Timestamp;
    requestedAt: Timestamp;
    termsVersion: string;
    termsAccepted: boolean;
    termsAcceptedAt: Timestamp;
    installments: DeferredPaymentInstallment[];
    rejectionReason?: string;
    refundStatus?: 'NOT_APPLICABLE' | 'PENDING' | 'COMPLETED';
}

export interface ReservationLinkedService {
    id: string;
    type: ReservationServiceType;
    title: string;
    status?: string;
    provider?: string;
    reference?: string;
    origin?: string;
    destination?: string;
    location?: string;
    startDate?: Date | Timestamp;
    endDate?: Date | Timestamp;
    amount?: number;
    quantity?: number;
    notes?: string;
    included?: boolean;
}

export interface FlightFirebaseBooking extends FirebaseBooking{
    type: "FLIGHT";
    flightDetails: FlightBookingDetails;
}

export interface FirebaseBooking{
    type: BookingTypes; // Tipo de reservación
    status: BookingStatus;
    created?: Timestamp; // Timestamp de creación
    bookingID?:string;
    pnr?: string;
    charges?: Charge[];
    contact?: ContactInfoValue;
    uid?: string;
    referer?: string;
    linkedServices?: ReservationLinkedService[];
    payment?: {
        type: PaymentType,
        method: PaymentMethod,
        originalAmount: number,
        amount: number,
        totalDue: number
        payed: number;
        status: PaymentStatus,
        office?: string,
        promo?: Promo,
        paymentLimit?: Timestamp,
        deferredPlan?: DeferredPaymentPlan,
        flowCheckout?: {
            checkoutUrl: string;
            token: string;
            flowOrder: number;
            commerceOrder: string;
            amount: number;
            subject: string;
            kyc?: {
                provider: 'DIDIT';
                url: string;
                sessionId?: string;
                status?: string;
                callbackUrl: string;
                createdAt: Timestamp | Date;
            };
            createdAt: Timestamp | Date;
        }
    };
    flightDetails?:FlightBookingDetails;
    hotelDetails?:HotelBookingDetails
}

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELED" | "VALIDATING";

export interface FlightBookingDetails{
    passengers: {
        counts: {
            childrens: number;
            adults: number;
            infants: number;
        },
        details?: PassengerValue[]
    },
    flights: SelectedFlights,
    origin: AmadeusLocation,
    destination: AmadeusLocation,
    departure: Timestamp,
    round: boolean,
    return?: Timestamp,
    seatMaps?: SeatMapSavingData[],
    aditionalServices?: FlightAdditionalServices
}

export interface FlightAdditionalServices{
    insurance?: {
        outbound: FlightAdditionalServiceItem[],
        inbound: FlightAdditionalServiceItem[]
    },
    carryOn?: {
        outbound: FlightAdditionalServiceItem[],
        inbound: FlightAdditionalServiceItem[]
    },
    baggage?: {
        outbound: FlightAdditionalServiceItem[],
        inbound: FlightAdditionalServiceItem[]
    },
    flexpass?: {
        outbound: FlightAdditionalServiceItem[],
        inbound: FlightAdditionalServiceItem[]
    }
}

export interface AdditionalServiceItem {
    type: AdditionalServiceType; // 'INSURANCE', 'TOUR', 'SPA', etc.
    context: AdditionalServiceContext;
    targetID: string | number; // Puede ser passengerID, roomID, etc.
    scope?: string | number; // 'OUTBOUND', 'INBOUND', o índice de habitación, etc.
    unitPrice: number;
    value: number | boolean | string; // Piezas, horas, cantidad de personas, etc.
    notes?: string;
    active: boolean; // true si está activo, false si no
    metadata?: Record<string, any>; // Datos adicionales específicos del tipo
}
export interface FlightAdditionalServiceItem extends AdditionalServiceItem {
    context: AdditionalServiceContext;
    scope: 'OUTBOUND' | 'INBOUND';
    value: number; // e.g., baggage pieces or carry-on count
}
export interface HotelAdditionalServiceItem extends AdditionalServiceItem {
    context: 'HOTEL';
    scope: number; // room index
    value: number | string; // e.g., nights, upgrade type
}
export interface ActivityAdditionalServiceItem extends AdditionalServiceItem {
    context: 'ACTIVITY';
    scope?: string; // optional schedule/time/date
    value: number | string; // number of participants or tier
}
export interface TransportAdditionalServiceItem extends AdditionalServiceItem {
    context: 'TRANSPORT';
    scope?: string; // direction or location ref
    value: number | string; // seats, hours, etc.
}

export type AdditionalServiceType = "INSURANCE"|"FLEXPASS"|"CARRYON"|"BAGGAGE"|"SEAT"|"ADDON"|"LINKED_SERVICE";
export type AdditionalServiceContext = 'FLIGHT' | 'HOTEL' | 'ACTIVITY' | 'TRANSPORT';

export interface HotelBookingDetails{
    checkin: Date|Timestamp,
    checkout: Date|Timestamp,
    hotel: HotelInfoBookingDetails,
    accomodation: AccomodationData[],
    offer: ModifiedRoomType
}

export interface HotelInfoBookingDetails{
    id: string,
    name: string,
    address: string,
    image: string,
    rating: number|null,
    ratingCount: number|null,
    stars: number|null,
    lat: number,
    lng: number,
    city: string,
    country: string
}

export interface ModifiedRoomType{
    roomTypeId: string;
    offerId: string;
    supplier: string;
    supplierId: number;
    rates: ModifiedRate[];
    offerRetailRate: { amount: number; currency: string };
    suggestedSellingPrice: { amount: number; currency: string; source: string };
    offerInitialPrice: { amount: number; currency: string };
    priceType: string;
    rateType: string;
}

export interface ModifiedRate {
    rateId: string;
    occupancyNumber: number;
    name: string;
    maxOccupancy: number;
    adultCount: number;
    childCount: number;
    boardType: string;
    boardName: string;
    remarks: string;
    priceType: string;
    commission: Commission;
    retailRate: ModifiedRetailRate;
    cancellationPolicies: CancellationPolicies;
    mappedRoomId?: number;
}

export interface ModifiedRetailRate {
    total: { amount: number; currency: string };
    suggestedSellingPrice: { amount: number; currency: string; source: string };
    initialPrice: { amount: number; currency: string };
} 

export interface AccomodationData{
    adults: number,
    childrens?: number,
    occupancyNumber: number,
    holder?: {
        name: string,
        lastname: string
    }
}

export interface OfflinePaymentData {
    id?: string;
    amount: number;
    method: 'SPEI' | 'CASH' | string;
    status: PaymentStatus;
    timestamp: Timestamp | Date;
    receptURL: string; // URL del comprobante de pago
    bookingRef?: DocumentReference;
    deferredPlanId?: string;
    installmentId?: string;
    senderBank?: string;
    paymentOffice?: string;
}

export interface PayPalPaymentData {
    method: 'PAYPAL';
    response: PayPalOrderCaptureResponse;
    timestamp: Timestamp | Date;
    statusMessage: PaymentErrorOutput;
    address: {
        line1: string;
        line2?: string;
        city: string;
        postal_code: string;
        country_code: string;
        neighborhood?: string;
        postal_code_info: CodigoPostalInfo|null;
    }
}

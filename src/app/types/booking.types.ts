import { Firestore, Timestamp } from "@angular/fire/firestore";
import { Charge } from "../pages/booking-process/booking-sidebar/booking-sidebar.component";
import { ContactInfoValue } from "../pages/booking-process/contact-info/contact-info.component";
import { ExtraBaggageData } from "../pages/booking-process/extras/add-carry-on/add-carry-on.component";
import { PassengerValue } from "../pages/booking-process/passengers/passengers.component";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { Promo } from "../services/xplora-promos.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
import { SeatMapSavingData } from "./amadeus-seat-map.types";
import { CancellationPolicies, Commission, Rate, RetailRate, RoomType, TaxesAndFees } from "./lite-api.types";

export type PaymentMethod = "CARD"|"CASH"|"SPEI";
export type PaymentType = "NOW"|"DELAYED";
export type BookingStatus = "CONFIRMED"|"PENDING"|"HOLD"|"CANCELED"|"REJECTED";
export type BookingTypes = 'FLIGHT' | 'HOTEL' | 'TRANSPORTATION' | 'ACTIVITY' | 'CAR_RENTAL' | 'CRUISE';

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
    payment?: {
        type: PaymentType,
        method: PaymentMethod,
        originalAmount: number,
        amount: number,
        totalDue: number
        office?: string,
        promo?: Promo
    };
    flightDetails?:FlightBookingDetails;
    hotelDetails?:HotelBookingDetails
}

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
    departure: Date,
    round: boolean,
    return?: Date,
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
    checkin: Date|firebase.default.firestore.Timestamp,
    checkout: Date|firebase.default.firestore.Timestamp,
    hotel: HotelInfoBookingDetails,
    accomodation: AccomodationData[],
    offer: ModifiedRoomType
}

export interface HotelInfoBookingDetails{
    id: string,
    name: string,
    address: string,
    image: string,
    rating: number,
    ratingCount: number,
    stars: number,
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
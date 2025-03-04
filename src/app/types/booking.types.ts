import { Charge } from "../pages/booking-process/booking-sidebar/booking-sidebar.component";
import { ContactInfoValue } from "../pages/booking-process/contact-info/contact-info.component";
import { ExtraBaggageData } from "../pages/booking-process/extras/add-carry-on/add-carry-on.component";
import { PassengerValue } from "../pages/booking-process/passengers/passengers.component";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { Promo } from "../services/xplora-promos.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
import { SeatMapSavingData } from "./amadeus-seat-map.types";
import { CancellationPolicies, Commission, Rate, RetailRate, RoomType, TaxesAndFees } from "./lite-api.types";
import { BookingTypes, BookingStatus } from "./xplora-api.types";

export type PaymentMethod = "CARD"|"CASH"|"SPEI";
export type PaymentType = "NOW"|"DELAYED";

export interface FirebaseBooking{
    type: BookingTypes; // Tipo de reservación
    status: BookingStatus;
    bookingID?:string;
    pnr?: string;
    charges?: Charge[];
    contact?: ContactInfoValue;
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
    aditionalServices?: {
        insurance?:number[][];
        flexpass?:number[][];
        carryon?:ExtraBaggageData[][];
        baggage?:ExtraBaggageData[][];
    }
}

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
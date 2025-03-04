import { Charge } from "../pages/booking-process/booking-sidebar/booking-sidebar.component";
import { ContactInfoValue } from "../pages/booking-process/contact-info/contact-info.component";
import { ExtraBaggageData } from "../pages/booking-process/extras/add-carry-on/add-carry-on.component";
import { PassengerValue } from "../pages/booking-process/passengers/passengers.component";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { Promo } from "../services/xplora-promos.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
import { SeatMapSavingData } from "./amadeus-seat-map.types";
import { FlightOffer } from "./flight-offer-amadeus.types";
import { RoomType } from "./lite-api.types";
import { Payment } from "./mp-response.types";

export interface XploraFlightBooking {
    origin: AmadeusLocation;
    bookingID?: string;
    flights: SelectedFlights;
    status: BookingStatus,
    passengers: {
        childrens: number;
        adults: number;
        infants: number;
    };
    created: number;
    destination: AmadeusLocation;
    departure: string;
    round: boolean;
    return?: string;
    passengersData?: PassengerValue[];
    seatMaps?: SeatMapSavingData[],
    aditionalServices?: {
        insurance?:number[][];
        flexpass?:number[][];
        carryon?:ExtraBaggageData[][];
        baggage?:ExtraBaggageData[][];
    },
    contact?: ContactInfoValue,
    activePayment?: {
        type: "efectivo"|"spei"|"tarjeta"|"tarjeta-declinada",
        originalAmount: number,
        amount: number,
        totalDue: number
        office?: string,
        promo?: Promo
    };
    charges?: Charge[]
}

export type BookingStatus = "CONFIRMED"|"PENDING"|"HOLD"|"CANCELED"|"REJECTED"
export type BookingTypes = 'FLIGHT' | 'HOTEL' | 'TRANSPORTATION' | 'ACTIVITY' | 'CAR_RENTAL' | 'CRUISE';
export interface UpdateResponse{
    status: 'UPDATED';
    booking: XploraFlightBooking
}
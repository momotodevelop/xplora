import { ContactInfoValue } from "../pages/booking-process/contact-info/contact-info.component";
import { ExtraBaggageData } from "../pages/booking-process/extras/add-carry-on/add-carry-on.component";
import { PassengerValue } from "../pages/booking-process/passengers/passengers.component";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
import { SeatMapSavingData } from "./amadeus-seat-map.types";
import { FlightOffer } from "./flight-offer-amadeus.types";

export interface XploraFlightBooking {
    origin: AmadeusLocation;
    bookingID: string;
    flights: SelectedFlights;
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
    contact?: ContactInfoValue
}

export interface UpdateResponse{
    status: 'UPDATED';
    booking: XploraFlightBooking
}
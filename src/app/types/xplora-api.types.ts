import { SelectedFlights } from "../services/flight-offers-data-handler.service";
import { AmadeusLocation } from "./amadeus-airport-response.types";
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
}
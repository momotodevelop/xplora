import { Timestamp } from "firebase/firestore";
import { SelectedFlights } from "../services/flight-offers-data-handler.service";

export interface EventPackage {
    id: string;
    slug: string;           // /paquetes/bad-bunny-dtmf-2025
    event: EventInfo;
    ticketOptions: TicketTier[];          // inventario por tier
    hotelOptions: HotelOption[];          // inventario por fecha / roomType
    flightOptions: FlightCombo[];         // pre-cotizadas o dinámicas
    baseCurrency: "MXN" | "USD"
    inclusions: PackageInclusions;
    extras: ExtraItemDefinition[];        // merch, créditos, etc.
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface EventInfo {
    name: string;
    startDate: string;      // ISO 8601
    endDate: string;
    venue: {
        name: string;
        address: string;
        lat: number;
        lng: number;
    };
    descriptionMd: string;  // Markdown ↔︎ CMS
}

export interface TicketTier {
    id: string;
    label: string;
    faceValue: number;           // precio nominal del boleto
    capacity: number;            // total
    sold: number;                // se actualiza en txn
    perks: string[];             // ej. ["Pit", "Acceso prioritario"]
}
export interface HotelOption {
    hotelId: string;           // referencia a tu catálogo de hoteles
    distanceMeters: number;
    rooms: HotelRoomType[];
}

export interface HotelRoomType {
    id: string;
    name: string;              // "Doble estándar", "Suite"
    board: "RO" | "BI" | "AI";
    nightlyRate: number;
    allotment: number;         // inventario bloqueado para el paquete
}

export interface FlightCombo {
    id: string;                // para relacionarlo en la reserva
    originIata: string;
    flights: SelectedFlights;
    price: number;             // por pasajero
    seatsLeft: number;         // opcional: sync con GDS
}

export interface PackageInclusions {
    groundTransport: boolean;
    mealsDrinks: boolean;
    loungeAccess: boolean;
    merch: boolean;
    eventCredit: boolean;
}

export interface ExtraItemDefinition {
    id: string;
    type: "transfer" | "mealPlan" | "merch" | "credit";
    name: string;
    description: string;
    price: number;
}
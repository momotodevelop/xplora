export interface APIResponse{
    meta: {
        count: number
    },
    data: SeatMap[]
}
export interface SeatMap {
    id:                     string;
    type:                   string;
    departure:              DepartureArrival;
    arrival:                DepartureArrival;
    carrierCode:            string;
    number:                 string;
    operating?:              Operating;
    aircraft:               Aircraft;
    class:                  string;
    flightOfferId:          string;
    segmentId:              string;
    decks:                  Deck[];
    aircraftCabinAmenities: AircraftCabinAmenities;
    availableSeatsCounters: AvailableSeatsCounter[];
    selectedSeats?: SelectedSeat[]
}

export interface SeatMapSavingData{
    id:string;
    departure: DepartureArrival;
    arrival: DepartureArrival;
    number: string;
    aircraft: Aircraft;
    carrierCode: string;
    segmentId: string;
    aircraftCabinAmenities: AircraftCabinAmenities;
    selectedSeats: SelectedSeat[];
    operating?: Operating;
}

export interface SelectedSeat {
    passengerID: number,
    seat?: SeatElement
}

export interface Aircraft {
    code: string;
}

export interface AircraftCabinAmenities {
    power:    Power;
    seat:     AircraftCabinAmenitiesSeat;
    wifi:     Wifi;
    food:     Food;
    beverage: Beverage;
}

export interface Beverage {
    isChargeable: boolean;
    beverageType: string;
}

export interface Food {
    isChargeable: boolean;
    foodType:     string;
}

export interface Power {
    isChargeable: boolean;
    powerType:    string;
    usbType:      string;
}

export interface AircraftCabinAmenitiesSeat {
    legSpace:  number;
    spaceUnit: string;
    tilt:      string;
    medias:    Media[];
}

export interface Media {
    title:       string;
    href:        string;
    description: Description;
    mediaType:   MediaType;
}

export interface Description {
    text: string;
    lang: string;
}

export type MediaType = "application"|"audio"|"font"|"example"|"image"|"message"|"model"|"multipart"|"text"|"video" 

export interface Wifi {
    isChargeable: boolean;
    wifiCoverage: string;
}

export interface DepartureArrival {
    iataCode: string;
    terminal?: string;
    at:       Date;
}

export interface AvailableSeatsCounter {
    travelerId: string;
    value:      number;
}

export interface Deck {
    deckType:          string;
    deckConfiguration: DeckConfiguration;
    seats:             SeatElement[];
}

export interface DeckConfiguration {
    width:         number;
    length:        number;
    startSeatRow:  number;
    endSeatRow:    number;
    startWingsX:   number;
    endWingsX:     number;
    startWingsRow: number;
    endWingsRow:   number;
    exitRowsX:     number[];
}

export interface SeatElement {
    cabin:                Cabin;
    number:               string;
    characteristicsCodes: string[];
    travelerPricing:      TravelerPricing[];
    coordinates:          Coordinates;
}

export type Cabin = "ECONOMY"|"PREMIUM_ECONOMY"|"BUSINESS"|"FIRST" ;

export interface Coordinates {
    x: number;
    y: number;
}

export interface TravelerPricing {
    travelerId:             string;
    seatAvailabilityStatus: SeatAvailabilityStatus;
    price?:                 Price;
}

export interface Price {
    currency: string;
    total:    string;
    base:     string;
    taxes:    Tax[];
}

export interface Tax {
    amount: string;
    code:   string;
}

export type SeatAvailabilityStatus = "AVAILABLE"|"BLOCKED"|"OCCUPIED";

export interface Departure {
    iataCode: string;
    terminal: string;
    at:       Date;
}

export interface Operating {
    carrierCode: string;
}

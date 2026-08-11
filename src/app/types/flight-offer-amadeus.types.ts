export interface FlightOfferSearchResponse {
    meta: Meta;
    data: FlightOffer[];
    dictionaries: Dictionaries;
}
export interface Meta {
    count: number;
    links: Links;
}
export interface Links {
    self: string;
}
export interface FlightOffer {
    type: string;
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: Itinerary[];
    price: Price;
    pricingOptions: PricingOptions;
    validatingAirlineCodes: string[];
    travelerPricings: TravelerPricing[];
    airlineLogoUrl?: string;
    conditions?: FlightOfferConditions;
    smartFare?: boolean;
    promoPrice?: PromoPrice;
}

export interface Itinerary {
    duration: string;
    segments: Segment[];
    conditions?: {
        changeBeforeDeparture?: FlightChangeCondition | null;
    };
}
export interface Segment {
    departure: DepartureArrival;
    arrival: DepartureArrival;
    carrierCode: string;
    carrierLogoUrl?: string;
    number: string;
    aircraft: Aircraft;
    operating: Operating;
    duration: string;
    id: string;
    numberOfStops: number;
    stops?: FlightStop[];
    blacklistedInEU: boolean;
}
export interface FlightStop {
    id: string;
    duration: string;
    arrivingAt?: string;
    departingAt?: string;
    airport: {
        iataCode: string;
        name: string;
        cityName?: string;
    };
}
export interface FlightChangeCondition {
    allowed: boolean;
    penaltyAmount?: string | null;
    penaltyCurrency?: string | null;
}
export interface FlightOfferConditions {
    changeBeforeDeparture?: FlightChangeCondition | null;
    refundBeforeDeparture?: FlightChangeCondition | null;
}
export interface DepartureArrival {
    iataCode: string;
    terminal?: string;
    at: string;
}
export interface Aircraft {
    code: string;
}
export interface Operating {
    carrierCode: string;
}
export interface Price {
    currency: string;
    total: string|number;
    base: string|number;
    fees: Fee[];
    grandTotal: string|number;
}
export interface PromoPrice {
    originalTotal: number;
    discountedTotal: number;
    discountAmount: number;
    discountType: 'percentage' | 'fixed';
    promoCode?: string;
    applyTo?: 'tax' | 'total' | 'base';
}
export interface Fee {
    amount: string|number;
    type: string;
}
export interface PricingOptions {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
}
export interface TravelerPricing {
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: Price;
    fareDetailsBySegment: FareDetailsBySegment[];
}
export interface FareDetailsBySegment {
    segmentId: string;
    cabin: "ECONOMY"|"PREMIUM_ECONOMY"|"BUSINESS"|"FIRST";
    fareBasis: string;
    class: string;
    includedCheckedBags: IncludedCheckedBags;
    includedCabinBags:{
        quantity: number;
    }
    brandedFare? :string;
    brandedFareLabel?: string;
}
export interface IncludedCheckedBags {
    weight?: number;
    weightUnit?: string;
    quantity: number;
}
export interface  Dictionaries {
    locations: { [key: string]: Location };
    aircraft: { [key: string]: string };
    currencies: { [key: string]: string };
    carriers: { [key: string]: string };
}
export interface Location {
    cityCode: string;
    countryCode: string;
}  

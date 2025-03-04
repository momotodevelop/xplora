export interface HotelOffersResponse {
    data: HotelOffer[];
    warnings?: Warning[];
  }
  
export interface HotelOffer {
    type: string; // "hotel-offers"
    hotel: HotelDetails;
    available: boolean;
    offers?: Offer[];
    self: string;
  }
  
export interface HotelDetails {
    type: string; // "hotel"
    hotelId: string;
    chainCode: string;
    dupeId: string;
    name: string;
    cityCode: string;
    latitude: number;
    longitude: number;
  }
  
export interface Offer {
    id: string;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    rateCode: string;
    commission?: Commission;
    room: Room;
    guests: Guests;
    price: Price;
    policies: Policies;
    self: string;
  }
  
export interface Commission {
    percentage: string; // Represented as a string, e.g., "10"
  }
  
export interface Room {
    type: string; // e.g., "KNG"
    typeEstimated: TypeEstimated;
    description?: RoomDescription;
  }
  
export interface TypeEstimated {
    category: string; // e.g., "STANDARD_ROOM"
    beds: number;
    bedType: string; // e.g., "KING"
  }
  
export interface RoomDescription {
    text: string;
    lang: string; // Language code, e.g., "ES"
  }
  
export interface Guests {
    adults: number;
  }
  
export interface Price {
    currency: string; // e.g., "USD"
    base: string; // Base price as a string, e.g., "182.00"
    total: string; // Total price as a string, e.g., "220.22"
    taxes?: Tax[];
    variations?: PriceVariations;
  }
  
export interface Tax {
    code: string; // e.g., "TOTAL_TAX"
    amount: string; // Amount as a string, e.g., "38.22"
    currency: string; // Currency code, e.g., "USD"
    included: boolean;
  }
  
export interface PriceVariations {
    average?: {
      base: string; // Average base price as a string
    };
    changes?: PriceChange[];
  }
  
export interface PriceChange {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    base: string; // Price as a string, e.g., "182.00"
  }
  
export interface Policies {
    cancellations?: CancellationPolicy[];
    paymentType: string; // e.g., "guarantee"
  }
  
export interface CancellationPolicy {
    deadline: string; // ISO 8601 format, e.g., "2024-12-23T23:59:00-06:00"
  }
  
export interface Warning {
    code: number;
    title: string;
    detail: string;
    source?: WarningSource;
  }
  
export interface WarningSource {
    parameter: string;
  }
  
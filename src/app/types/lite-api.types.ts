export interface Occupancy{
    adults: number,
    children?: number[]
}
//HOTEL LIST
export interface HotelListResult {
    id: string;
    name: string;
    hotelDescription: string;
    hotelTypeId: number;
    chainId: number;
    chain: string;
    currency: string;
    country: string;
    city: string;
    latitude: number;
    longitude: number;
    address: string;
    zip: string;
    main_photo: string;
    thumbnail?: string;
    stars: number;
    rating: number;
    reviewCount: number;
    facilityIds: number[];
}
export interface HotelsListResponse {
    data: HotelListResult[];
    hotelIds: string[];
    total: number;
}
//DETAILS
export interface HotelDetailsResponse {
    data: HotelDetails;
}
export interface HotelDetails {
    id: string;
    name: string;
    hotelDescription: string;
    hotelImportantInformation?: string;
    checkinCheckoutTimes?: CheckinCheckoutTimes;
    hotelImages: HotelImage[];
    main_photo: string;
    country: string;
    city: string;
    starRating?: number;
    location: Location;
    address: string;
    hotelFacilities: string[];
    chainId?: number;
    chain?: string;
    facilities?: Facility[];
    rooms: Room[];
    phone?: string;
    fax?: string;
    email?: string;
    hotelType?: string;
    hotelTypeId?: number;
    airportCode?: string;
    rating?: number;
    reviewCount?: number;
    parking?: string;
    groupRoomMin?: number;
    childAllowed?: boolean;
    petsAllowed?: boolean;
    policies?: Policy[];
}
export interface CheckinCheckoutTimes {
    checkout: string;
    checkin: string;
    checkinStart?: string;
    checkinEnd?: string;
}
export interface HotelImage {
    url: string;
    urlHd: string;
    caption: string;
    order: number;
    defaultImage: boolean;
}

export interface Location {
    latitude: number;
    longitude: number;
}
export interface Facility {
    facilityId: number;
    name: string;
}
export interface Room {
    id: number;
    roomName: string;
    description: string;
    roomSizeSquare: number;
    roomSizeUnit: string;
    hotelId: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    bedTypes: BedType[];
    roomAmenities: RoomAmenity[];
    photos: RoomPhoto[];
}
export interface BedType {
    quantity: number;
    bedType: string;
    bedSize: string;
}
export interface RoomAmenity {
    amenitiesId: number;
    name: string;
    sort: number;
}
export interface RoomPhoto {
    url: string;
    imageDescription: string;
    imageClass1: string;
    imageClass2?: string;
    failoverPhoto: string;
    mainPhoto: boolean;
    score: number;
    classId: number;
    classOrder: number;
    hd_url: string;
}
export interface Policy {
    policy_type: string;
    name: string;
    description: string;
    child_allowed?: string;
    pets_allowed?: string;
    parking?: string;
}  
//REVIEWA
export interface HotelReview {
    averageScore: number;
    country: string;
    type: string;
    name: string;
    date: string;
    headline: string;
    language: string;
    pros: string;
    cons: string;
}
export interface HotelReviewsResponse {
    data: HotelReview[];
}
//CITIES
export interface Cities{
    data: City[]
}
export interface City{
    city: string
}
//COUNTRIES
export interface Countries{
    data: Country[]
}
export interface Country{
    code: string,
    name: string
}
//MIN RATES
export interface HotelMinRate {
    hotelId: string;
    price: number;
    sugestedSellPrice: number;
}
export interface HotelMinRatesResponse {
    data: HotelMinRate[];
    sandbox: boolean;
}
//FULL RATES
export interface TaxesAndFees {
    included: boolean;
    description: string;
    amount: number;
    currency: string;
}
export interface RetailRate {
    total: Array<{ amount: number; currency: string }>;
    suggestedSellingPrice: Array<{ amount: number; currency: string; source: string }>;
    initialPrice: Array<{ amount: number; currency: string }>;
    taxesAndFees: TaxesAndFees[];
}  
export interface Commission {
    amount: number;
    currency: string;
}
export interface CancellationPolicyInfo {
    cancelTime: string;
    amount: number;
    currency: string;
    type: string;
    timezone: string;
}
export interface CancellationPolicies {
    cancelPolicyInfos: CancellationPolicyInfo[];
    hotelRemarks: string[];
    refundableTag: string;
}

export interface Rate {
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
    commission: Commission[];
    retailRate: RetailRate;
    cancellationPolicies: CancellationPolicies;
    mappedRoomId?: number;
}
export interface RoomType {
    roomTypeId: string;
    offerId: string;
    supplier: string;
    supplierId: number;
    rates: Rate[];
    offerRetailRate: { amount: number; currency: string };
    suggestedSellingPrice: { amount: number; currency: string; source: string };
    offerInitialPrice: { amount: number; currency: string };
    priceType: string;
    rateType: string;
}
export interface HotelFullRate {
    hotelId: string;
    roomTypes: RoomType[];
}
export interface HotelFullRatesResponse {
    data: HotelFullRate[];
    guestLevel: number;
    sandbox: boolean;
}  

//DICTIONARIES

export interface FacilitiesResponse{
    data: FacilityDescription[]
}

export interface FacilityDescription {
    facility_id: number;
    facility: string;
    sort: number;
    translation: { lang: string; facility: string }[];
}

export interface BoardTypeDefinition {
    id: string;
    es: string;
    en: string;
    description: {
        es: string;
        en: string;
    };
    includes: {
        food: {
            breakfast: boolean;
            lunch: boolean;
            dinner: boolean;
        };
        beverage: boolean;
        alcoholic: boolean;
        snacks: boolean;
        roomService: boolean;
    };
}


export interface HotelSearchResponse{
    data: Hotel[],
    meta: {
        links: {
            self: string
        },
        count: number
    }
}
export interface Hotel {
    chainCode: string;
    iataCode: string;
    dupeId: number;
    name: string;
    hotelId: string;
    geoCode: GeoCode;
    address: Address;
    distance: Distance;
    lastUpdate: string; // ISO 8601 formatted date string
}

export interface GeoCode {
    latitude: number;
    longitude: number;
}

export interface Address {
    countryCode: string;
}

export interface Distance {
    value: number;
    unit: string;
}  
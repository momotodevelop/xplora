export interface AmadeusSearchLocationResponse {
    meta: Meta;
    data: AmadeusLocation[];
}
export interface AmadeusGetLocationResponse {
    meta: {
        links: {
            self: string
        }
    };
    data: AmadeusLocation;
}
interface Meta {
    count: number;
    links: Links;
}
interface Links {
    self: string;
}
export interface AmadeusLocation {
    type: string;
    subType: "AIRPORT"|"CITY";
    name: string;
    detailedName: string;
    id: string;
    self: Self;
    timeZoneOffset: string;
    iataCode: string;
    geoCode: GeoCode;
    address: Address;
    analytics?: Analytics;
}
interface Self {
    href: string;
    methods: string[];
}
interface GeoCode {
    latitude: number;
    longitude: number;
}
interface Address {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
    regionCode: string;
}
interface Analytics {
    travelers: Travelers;
}
interface Travelers {
    score: number;
}  

//Error

export interface AmadeusLocationResponseError {
    headers: HttpHeaders;
    status: number;
    statusText: string;
    url: string;
    ok: boolean;
    name: string;
    message: string;
    error: HttpError;
}
interface HttpHeaders {
    normalizedNames: any;
    lazyUpdate: null | any[];
}
interface HttpError {
    errors: ErrorDetail[];
}
interface ErrorDetail {
    code: number;
    title: string;
    detail: string;
    status: number;
}
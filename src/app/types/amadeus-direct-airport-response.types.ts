export interface DirectDestination {
    type: string;
    subtype: string;
    name: string;
    iataCode: string;
    geoCode: {
        latitude: number;
        longitude: number;
    };
    address: {
        cityName: string;
        countryName: string;
        stateCode: string;
        regionCode: string;
    };
    timeZone: {
        offset: string;
        referenceLocalDateTime: string;
    };
    metrics: {
        relevance: number;
    };
}
export interface DirectDestinationsResponse {
    meta: {
        count: number;
        links: {
            self: string;
        };
    };
    data: DirectDestination[];
}
import { AmadeusLocation } from "../types/amadeus-airport-response.types";

export const ORIGINS:AmadeusLocation[] = [
    {
        type: "location",
        subType: "AIRPORT",
        name: "BENITO JUAREZ INTL",
        detailedName: "MEXICO CITY/MX:BENITO JUAREZ I",
        id: "AMEX",
        self: {
            href: "https://test.api.amadeus.com/v1/reference-data/locations/AMEX",
            methods: [
                "GET"
            ]
        },
        timeZoneOffset: "-06:00",
        iataCode: "MEX",
        geoCode: {
            latitude: 19.43639,
            longitude: -99.07222
        },
        address: {
            cityName: "CIUDAD DE MÉXICO",
            cityCode: "MEX",
            countryName: "MÉXICO",
            countryCode: "MX",
            regionCode: "NAMER"
        },
        analytics: {
            travelers: {
                score: 35
            }
        }
    },
    {
        type: "location",
        subType: "AIRPORT",
        name: "FELIPE ANGELES INTL",
        detailedName: "MEXICO CITY/MX:FELIPE ANGELES",
        id: "ANLU",
        self: {
            href: "https://test.api.amadeus.com/v1/reference-data/locations/ANLU",
            methods: [
                "GET"
            ]
        },
        timeZoneOffset: "-06:00",
        iataCode: "NLU",
        geoCode: {
            latitude: 19.75667,
            longitude: -99.01527
        },
        address: {
            cityName: "CIUDAD DE MÉXICO",
            cityCode: "MEX",
            countryName: "MÉXICO",
            countryCode: "MX",
            regionCode: "NAMER"
        }
    },
    {
        type: "location",
        subType: "AIRPORT",
        name: "INTERNATIONAL",
        detailedName: "CANCÚN/MX:INTERNATIONAL",
        id: "ACUN",
        self: {
            href: "https://api.amadeus.com/v1/reference-data/locations/ACUN",
            methods: [
                "GET"
            ]
        },
        timeZoneOffset: "-05:00",
        iataCode: "CUN",
        geoCode: {
            latitude: 21.03667,
            longitude: -86.87694
        },
        address: {
            cityName: "CANCÚN",
            cityCode: "CUN",
            countryName: "MÉXICO",
            countryCode: "MX",
            regionCode: "NAMER"
        },
        analytics: {
            travelers: {
                score: 14
            }
        }
    },
    {
        type: "location",
        subType: "AIRPORT",
        name: "MIGUEL HIDALGO INTL",
        detailedName: "GUADALAJARA/MX:MIGUEL HIDALGO",
        id: "AGDL",
        self: {
            href: "https://api.amadeus.com/v1/reference-data/locations/AGDL",
            methods: [
                "GET"
            ]
        },
        timeZoneOffset: "-06:00",
        iataCode: "GDL",
        geoCode: {
            latitude: 20.52167,
            longitude: -103.3111
        },
        address: {
            cityName: "GUADALAJARA",
            cityCode: "GDL",
            countryName: "MÉXICO",
            countryCode: "MX",
            regionCode: "NAMER"
        },
        analytics: {
            travelers: {
                score: 9
            }
        }
    },
    {
        type: "location",
        subType: "AIRPORT",
        name: "MARIANO ESCOBEDO INTL",
        detailedName: "MONTERREY/MX:MARIANO ESCOBEDO",
        id: "AMTY",
        self: {
            href: "https://api.amadeus.com/v1/reference-data/locations/AMTY",
            methods: [
                "GET"
            ]
        },
        timeZoneOffset: "-06:00",
        iataCode: "MTY",
        geoCode: {
            latitude: 25.77862,
            longitude: -100.1069
        },
        address: {
            cityName: "MONTERREY",
            cityCode: "MTY",
            countryName: "MÉXICO",
            countryCode: "MX",
            regionCode: "NAMER"
        },
        analytics: {
            travelers: {
                score: 7
            }
        }
    }
]
export interface HotelSentimentsResponse {
    meta: {
        count: number;
        links: {
            self: string;
        };
    };
    data: HotelSentiment[];
}
export interface HotelSentiment {
    hotelId: string;
    overallRating: number;
    numberOfReviews: number;
    numberOfRatings: number;
    type: string; // Considera cambiar a un tipo literal si solo puede ser "hotelSentiment"
    sentiments: Sentiments;
}
export interface Sentiments {
    staff: number;
    location: number;
    service: number;
    roomComforts: number;
    internet: number;
    sleepQuality: number;
    valueForMoney: number;
    facilities: number;
    catering: number;
    pointsOfInterest: number;
}
import { FlightOffer } from '../types/flight-offer-amadeus.types';

const DUFFEL_AIRLINE_LOCKUP_BASE_URL =
  'https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/';
const DEFAULT_AIRLINE_IMAGE = 'assets/img/dashboard/sidebar/airplane.svg';

export function resolveAirlineLogoUrl(offer?: FlightOffer): string {
  const firstSegment = offer?.itineraries?.[0]?.segments?.[0];
  const storedLogoUrl = firstSegment?.carrierLogoUrl || offer?.airlineLogoUrl;

  if (storedLogoUrl) return storedLogoUrl;

  const carrierCode = firstSegment?.carrierCode || offer?.validatingAirlineCodes?.[0];
  if (carrierCode) {
    return `${DUFFEL_AIRLINE_LOCKUP_BASE_URL}${encodeURIComponent(carrierCode.trim())}.svg`;
  }

  return DEFAULT_AIRLINE_IMAGE;
}

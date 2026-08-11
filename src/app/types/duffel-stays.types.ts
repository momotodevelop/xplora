import type { DuffelEnvironment } from '../services/xplora-flight-config.service';

export interface DuffelStaysPublicConfig {
  enabled: boolean;
}

export interface DuffelStaysAdminConfig extends DuffelStaysPublicConfig {
  environment: DuffelEnvironment;
  secrets: {
    productionConfigured: boolean;
    testConfigured: boolean;
  };
}

export interface DuffelStaysConnectionStatus {
  connected: boolean;
  environment: DuffelEnvironment;
  checkedAt: string;
}

export type DuffelStaysDestinationType =
  | 'city'
  | 'airport'
  | 'accommodation';

export interface DuffelStaysDestinationSuggestion {
  id: string;
  type: DuffelStaysDestinationType;
  name: string;
  secondaryName: string;
  latitude: number;
  longitude: number;
}

export interface DuffelStaysDestinationSuggestionsResponse {
  data: DuffelStaysDestinationSuggestion[];
}

export interface DuffelStaysDestinationSelection {
  id: string;
  type: DuffelStaysDestinationType;
  name: string;
  lat: number;
  lng: number;
}

export interface DuffelStaysSearchInput {
  latitude: number;
  longitude: number;
  radius?: number;
  rooms: number;
  adults: number;
  childrenAges?: number[];
  checkInDate: string;
  checkOutDate: string;
  mobile?: boolean;
}

export interface DuffelStaysPhoto {
  url: string;
}

export interface DuffelStaysAmenity {
  type: string;
  description: string;
}

export interface DuffelStaysAddress {
  city_name?: string;
  country_code?: string;
  line_one?: string;
  postal_code?: string;
  region?: string;
}

export interface DuffelStaysAccommodation {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  review_score?: number;
  review_count?: number;
  photos?: DuffelStaysPhoto[];
  amenities?: DuffelStaysAmenity[];
  location?: {
    address?: DuffelStaysAddress;
    geographic_coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface DuffelStaysSearchResult {
  id: string;
  accommodation: DuffelStaysAccommodation;
  check_in_date: string;
  check_out_date: string;
  rooms: number;
  expires_at: string;
  cheapest_rate_total_amount: string;
  cheapest_rate_currency: string;
  cheapest_rate_public_amount?: string | null;
  cheapest_rate_public_currency?: string | null;
}

export interface DuffelStaysSearchResponse {
  data: {
    created_at: string;
    results: DuffelStaysSearchResult[];
  };
}

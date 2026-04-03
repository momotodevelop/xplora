import { Timestamp } from '@angular/fire/firestore';
import { AmadeusActivity } from './amadeus-tours-response.types';

export type TourDayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface TourAvailabilityDay {
  key: TourDayKey;
  label: string;
  enabled: boolean;
  times: string[];
}

export type TourDiscountType = 'percentage' | 'fixed';

export interface XploraTour extends Omit<AmadeusActivity, 'id'> {
  id?: string;
  amadeusId?: string;
  priceUsd?: AmadeusActivity['price'];
  exchangeRate?: number;
  discountType?: TourDiscountType;
  discountValue?: number;
  featuredImage?: string;
  operatorName: string;
  categories?: string[];
  availableDays: TourAvailabilityDay[];
  languages: string[];
  includes: string[];
  excludes: string[];
  source?: 'amadeus' | 'manual';
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

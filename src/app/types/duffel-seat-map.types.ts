export interface DuffelSeatMapResponse {
  data: DuffelSeatMap[];
  meta?: Record<string, unknown>;
}

export interface DuffelSeatMap {
  id: string;
  segment_id: string;
  slice_id: string;
  cabins: DuffelSeatCabin[];
}

export interface DuffelSeatCabin {
  aisles: number;
  cabin_class: string;
  deck: number;
  rows: DuffelSeatRow[];
  wings?: DuffelSeatWings | null;
}

export interface DuffelSeatWings {
  first_row_index: number;
  last_row_index: number;
}

export interface DuffelSeatRow {
  sections: DuffelSeatSection[];
}

export interface DuffelSeatSection {
  elements: DuffelSeatElement[];
}

export interface DuffelSeatElement {
  type: string;
  name?: string;
  designator?: string;
  disclosures?: string[];
  available_services?: DuffelSeatService[];
}

export interface DuffelSeatService {
  id: string;
  passenger_id: string;
  total_amount: string;
  total_currency: string;
}

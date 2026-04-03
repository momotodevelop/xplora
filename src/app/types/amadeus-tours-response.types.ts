export interface AmadeusToursResponse {
  meta: Meta;
  data: AmadeusActivity[];
}

export interface AmadeusActivityResponse {
  data: AmadeusActivity;
}

interface Meta {
  count: string;
  links: Links;
}

interface Links {
  self: string;
}

export interface AmadeusActivity {
  id: string;
  type: string;
  self: Self;
  name: string;
  shortDescription?: string;
  description?: string;
  geoCode: GeoCode;
  rating?: string;
  pictures: string[];
  bookingLink: string;
  price: Price;
  originalPrice?: Price;
  minimumDuration: string;
}

interface Self {
  href: string;
  methods: string[];
}

interface GeoCode {
  latitude: number | string;
  longitude: number | string;
}

interface Price {
  currencyCode: string;
  amount: string;
}

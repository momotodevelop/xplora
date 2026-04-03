import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

export interface GoogleWeatherForecastDay {
  displayDate?: { year: number; month: number; day: number };
  maxTemperature?: { degrees?: number; unit?: string };
  minTemperature?: { degrees?: number; unit?: string };
  daytimeForecast?: {
    weatherCondition?: {
      description?: { text?: string };
      iconBaseUri?: string;
      type?: string;
    };
  };
  nighttimeForecast?: {
    weatherCondition?: {
      description?: { text?: string };
      iconBaseUri?: string;
      type?: string;
    };
  };
}

export interface GoogleWeatherForecastResponse {
  forecastDays?: GoogleWeatherForecastDay[];
  timeZone?: { id?: string };
}

interface GoogleGeocodeResponse {
  results?: Array<{ formatted_address?: string }>;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private apiKey: string = environment.googleMapsApiKey;
  private geocodeBaseUrl = 'https://maps.googleapis.com/maps/api/geocode';
  private weatherBaseUrl = 'https://weather.googleapis.com/v1';

  constructor(private http: HttpClient) { }

  getStaticMapRouteUrl(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const path = `path=color:0xff0000ff|weight:2|${lat1},${lng1}|${lat2},${lng2}`;
    const size = '1920x300';
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${size}&maptype=roadmap&${path}&key=${this.apiKey}`;
    return mapUrl;
  }
  getStaticMapUrl(lat: number, lng: number, zoom: number = 15, width: number = 600, height: number = 400): string {
    const size = `${width.toString()}x${height.toString()}`;
    const iconUrl = encodeURIComponent('https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/hotel-pin.png?alt=media&token=747109a6-69a4-451b-9c74-90473a525071');
    //const marker = `icon:${iconUrl}|${lat},${lng}`;
    const marker = `color:blue|label:H|${lat},${lng}`;
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&scale=2&maptype=roadmap&markers=${marker}&format=jpg&key=${this.apiKey}`;
    return mapUrl;
  }

  getReverseGeocode(lat: number, lng: number, languageCode: string = 'es-MX'): Observable<string | null> {
    const params = new HttpParams()
      .set('latlng', `${lat},${lng}`)
      .set('language', languageCode)
      .set('key', this.apiKey);
    return this.http
      .get<GoogleGeocodeResponse>(`${this.geocodeBaseUrl}/json`, { params })
      .pipe(map(response => response.results?.[0]?.formatted_address ?? null));
  }

  getDailyForecast(
    lat: number,
    lng: number,
    days: number = 5,
    unitsSystem: 'METRIC' | 'IMPERIAL' = 'METRIC',
    languageCode: string = 'es-MX'
  ): Observable<GoogleWeatherForecastResponse> {
    const params = new HttpParams()
      .set('key', this.apiKey)
      .set('location.latitude', lat.toString())
      .set('location.longitude', lng.toString())
      .set('days', days.toString())
      .set('unitsSystem', unitsSystem)
      .set('languageCode', languageCode);
    return this.http.get<GoogleWeatherForecastResponse>(`${this.weatherBaseUrl}/forecast/days:lookup`, { params });
  }

  getWeatherIconUrl(iconBaseUri?: string, variant: 'light' | 'dark' = 'light', format: 'svg' | 'png' = 'svg'): string | null {
    if (!iconBaseUri) return null;
    const suffix = variant === 'dark' ? '_dark' : '';
    return `${iconBaseUri}${suffix}.${format}`;
  }
}

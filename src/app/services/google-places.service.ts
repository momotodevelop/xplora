import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GooglePlacesService {
  constructor(private http: HttpClient) { }
  private apiKey = 'AIzaSyCu0Vjm1GoMAZQCtNQpRiI1fbhmwpTBkHI';
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private googleMapsLibrary?: google.maps.PlacesLibrary;
  
  async loadGoogleMapsLibrary() {
    if (!this.googleMapsLibrary) {
      this.googleMapsLibrary = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
    }
    return this.googleMapsLibrary;
  }

  async fetchAutocompleteSuggestions(input: string) {
    const { AutocompleteSessionToken, AutocompleteSuggestion } = await this.loadGoogleMapsLibrary();

    const token = new AutocompleteSessionToken();
    const request = {
      input,
      includedPrimaryTypes: ["lodging", "airport", "locality", "point_of_interest"],
      language: "es-MX",
      sessionToken: token,
    }
    const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
    return suggestions;
  }

  getPhotoUrlFromPlace(query: string, lat?: number, lng?: number): Observable<string | null> {
    let params = new HttpParams()
      .set('input', query)
      .set('inputtype', 'textquery')
      .set('fields', 'photos')
      .set('key', this.apiKey);

    if (lat !== undefined && lng !== undefined) {
      params = params.set('locationbias', `point:${lat},${lng}`);
    }

    return this.http.get<any>(`${this.baseUrl}/findplacefromtext/json`, { params }).pipe(
      map((response) => {
        const candidates = response.candidates;
        if (candidates && candidates.length > 0 && candidates[0].photos) {
          const photoReference = candidates[0].photos[0].photo_reference;
          if (photoReference) {
            return this.getPhotoUrl(photoReference);
          }
        }
        return null;
      })
    );
  }

  getAutocompleteSuggestions(input: string, lat?: number, lng?: number, country:boolean=true, locality:boolean=true, lodging:boolean=true, airport:boolean=true, point_of_interest:boolean=true): Observable<any[]> {
    let params = new HttpParams()
      .set('input', input)
      .set('types', 'country|locality|lodging|airport|point_of_interest') // Filtra regiones (ciudades/países) y establecimientos (hoteles/aeropuertos)
      .set('key', this.apiKey);
    
    const types: string[] = [];
    if (country) types.push('country');
    if (locality) types.push('locality');
    if (lodging) types.push('lodging');
    if (airport) types.push('airport');
    if (point_of_interest) types.push('point_of_interest');
    if (types.length > 0) {
      params = params.set('types', types.join('|'));
    }
    if (lat !== undefined && lng !== undefined) {
      params = params.set('locationbias', `point:${lat},${lng}`);
    }

    return this.http.get<any>(`${this.baseUrl}/autocomplete/json`, { params }).pipe(
      map((response) => {
        if (response.predictions) {
          return response.predictions.map((prediction: any) => ({
            description: prediction.description,
            placeId: prediction.place_id
          }));
        }
        return [];
      })
    );
  }

  async getPlace(placeId:string, fields: string[]){
    const { Place } = await this.loadGoogleMapsLibrary();
    const place = await new Place({
      id: placeId,
      requestedLanguage: "es"
    });
    return place.fetchFields({fields});
  }
  async searchPlaceFromLocation(query:string, lat:number, lng: number, fields:string[]){
    const { Place, SearchNearbyRankPreference } = await this.loadGoogleMapsLibrary();
    let center = new google.maps.LatLng(lat, lng);
    const request = {
        // required parameters
        fields,
        locationRestriction: {
            center: center,
            radius: 500, 
        },
        // optional parameters
        includedPrimaryTypes: ['lodging'],
        maxResultCount: 1,

        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: 'es-MX',
        region: 'mx',
    };
    const { places } = await Place.searchNearby(request);
    return places;
  }
  async textSearchPlace(query:string, lat:number, lng: number, fields:string[]){
    const { Place, SearchByTextRankPreference } = await this.loadGoogleMapsLibrary(); 
    const {places} = await Place.searchByText({
      fields,
      locationBias: {lat, lng},
      textQuery: query,
      includedType: 'lodging',
      language: 'es',
      rankPreference: SearchByTextRankPreference.RELEVANCE
    });
    return places;
  }
  private getPhotoUrl(photoReference: string): string {
    const params = new HttpParams().set('photoreference', photoReference).set('maxwidth', '1920').set('key', this.apiKey);
    return `${this.baseUrl}/photo?${params.toString()}`;
  }
  getPhotoUrlFromCityCountry(city: string, country: string): Observable<string|null> {
    return this.getPhotoUrlFromPlace(encodeURIComponent(city + ', ' + country));
  }
}
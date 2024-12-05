import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GooglePlacesService {
  private apiKey: string = 'AIzaSyDjJYipKybawD3UwTlCg32ovO-bOpbvtm8';

  constructor(private http: HttpClient) { }

  getPlaceImageUrl(city: string, country: string): Observable<string> {
    const placeSearchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(city + ', ' + country)}&inputtype=textquery&fields=photos&key=${this.apiKey}`;
    console.log(placeSearchUrl);
    return this.http.get<any>(placeSearchUrl).pipe(
      map(response => {
        console.log(response);
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].photos) {
          const photoReference = response.candidates[0].photos[0].photo_reference;
          return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${this.apiKey}`;
        } else {
          throw new Error('No photos found for the given place');
        }
      })
    );
  }
}
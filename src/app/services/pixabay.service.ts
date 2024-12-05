import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PixabayService {
  private apiKey: string = '44458166-1424484f36ac00196f32f596d';
  private apiUrl: string = 'https://pixabay.com/api/';

  constructor(private http: HttpClient) { }

  getCityImage(city: string, country: string): Observable<string> {
    const query = `${city},${country}`;
    const url = `${this.apiUrl}?key=${this.apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&category=places&editors_choice=true&safesearch=true&min_width=1920&min_height=300`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.hits && response.hits.length > 0) {
          const photo = response.hits[0];
          return photo.largeImageURL;
        } else {
          throw new Error('No images found for the given place');
        }
      })
    );
  }
}
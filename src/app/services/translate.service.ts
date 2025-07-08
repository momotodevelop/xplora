import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { AmadeusLocation } from '../types/amadeus-airport-response.types';

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private apiUrl = 'https://13egxmebrf.execute-api.us-east-2.amazonaws.com/v1/translateService'; // Cambia esto por tu URL de API Gateway

  constructor(private http: HttpClient) { }

  private translateText(text: string, sourceLang: string, targetLang: string): Observable<string> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    const body = { text, sourceLanguageCode: sourceLang, targetLanguageCode: targetLang };
    return this.http.post<{original:string, translated:string}>(this.apiUrl, JSON.stringify(body), httpOptions).pipe(
      map(response => response.translated), // Asume que tu API responde con un campo 'translatedText'
      catchError(error => {
        console.error('Error al traducir:', error);
        return of(text); // Devuelve el texto original en caso de error
      })
    );

  }
  private translateLocation(location: AmadeusLocation):Observable<AmadeusLocation>{
    const translateRequest:Observable<string>[]=[
      this.translateText(location.address.cityName, 'en', 'es'),
      this.translateText(location.address.countryName, 'en', 'es')
    ];
    return forkJoin(translateRequest).pipe(
      map(([ciudad, pais])=>({
        ...location,
        address: {
          ...location.address,
          cityName: ciudad,
          countryName: pais
        }
      }))
    )
  }
}
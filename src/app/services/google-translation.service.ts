import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, retry } from 'rxjs';

export interface Translation{
  translatedText: string;
}
export interface V2Response{
  data: {
    translations: Translation[]
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleTranslationService {
  private apiKey = 'AIzaSyBmhMUkd_9tA7plS_f1HRynQfZg3SeYYIQ'; // ⚠️ Reemplázala con tu API Key
  private apiV2Url = 'https://translation.googleapis.com/language/translate/v2';
  private apiV3Url = 'https://translation.googleapis.com/v3/projects/ace-sight-444308-c5/locations/global:translateText';
  constructor(private http: HttpClient) { }
  /**
   * Traducción usando Cloud Translation API v2
   */
  translateV2(text: string | string[], targetLang: string, sourceLang?: string): Observable<V2Response> {
    const body = {
      q: text, // Si 'text' es un array, se enviará como un array en el POST
      target: targetLang,
      source: sourceLang || undefined,
      format: 'text'
    };

    return this.http.post<V2Response>(`${this.apiV2Url}?key=${this.apiKey}`, body).pipe(retry(10));
  }

  /**
   * Traducción usando Cloud Translation API v3
   */
  private translateV3(text: string, targetLang: string, sourceLang?: string): Observable<any> {
    const body = {
      contents: [text],
      targetLanguageCode: targetLang,
      sourceLanguageCode: sourceLang || undefined,
      mimeType: 'text/plain'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiV3Url}?key=${this.apiKey}`, body, { headers }).pipe(retry(10));
  }

}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface LinkShortenerResponse {
  originalURL: string;
  DomainId: number;
  archived: boolean;
  source: string;
  cloaking: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  OwnerId: number;
  tags: any[]; // Assuming it's an array of any type, you can specify the type if you know it
  path: string;
  idString: string;
  shortURL: string;
  secureShortURL: string;
  duplicate: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class LinkShortenerService {

  constructor(private http: HttpClient) { }
  create(originalURL:string):Observable<LinkShortenerResponse>{
    const data={
      originalURL,
      domain: 'link.xploratravel.com.mx'
    }
    const headers = new HttpHeaders({
      'Authorization': "sk_0jYyFJRnWagDN2pA"
    });
    return this.http.post<LinkShortenerResponse>("https://api.short.io/links", data, { headers })
  }
}

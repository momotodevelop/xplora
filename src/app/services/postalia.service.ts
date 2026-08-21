import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PostaliaNeighborhood {
  nombre: string;
  tipo?: string;
}

export interface PostaliaPostalCode {
  codigo_postal: string;
  estado: string;
  municipio: string;
  ciudad: string;
  zona?: string;
  colonias: PostaliaNeighborhood[];
}

@Injectable({
  providedIn: 'root'
})
export class PostaliaService {
  private readonly endpoint = environment.postaliaApiUrl;

  constructor(private readonly http: HttpClient) {}

  getPostalCode(postalCode: string): Observable<PostaliaPostalCode> {
    const params = new HttpParams().set('postalCode', postalCode);
    return this.http.get<PostaliaPostalCode>(this.endpoint, { params });
  }
}

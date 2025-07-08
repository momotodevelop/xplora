import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AmadeusAuthService {
  private authUrl = environment.amadeusApiUrl+'/v1/security/oauth2/token';

  constructor(private http: HttpClient) { }

  getToken(): Observable<string | null> {
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set('client_id', environment.amadeusClientId); // Reemplazar con tu Client ID
    body.set('client_secret', environment.amadeusClientSecret); // Reemplazar con tu Client Secret

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<any>(this.authUrl, body.toString(), { headers }).pipe(retry(10)).pipe(
      map(response => response.access_token),
      catchError(error => {
        console.error('Error obteniendo el token de acceso', error);
        return of(null);
      })
    );
  }
}

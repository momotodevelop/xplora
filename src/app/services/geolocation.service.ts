// src/app/services/geolocation.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  getUbicacionActual(): Observable<GeolocationPosition> {
    return new Observable((observer) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          observer.next(position);
          observer.complete();
        }, (error) => {
          observer.error(error);
        });
      } else {
        observer.error('La Geolocalización no está soportada por este navegador.');
      }
    });
  }
}

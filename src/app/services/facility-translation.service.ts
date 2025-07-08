import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';// Asegúrate de definir tus modelos
import { GoogleTranslationService } from './google-translation.service';
import { Facility, FacilityDescription } from '../types/lite-api.types';
import { LiteApiService } from './lite-api.service';

@Injectable({
  providedIn: 'root'
})
export class FacilityTranslationService {
  private facilityCache = new Map<number, BehaviorSubject<string>>();
  private facilitiesDictionary: FacilityDescription[] | null = null; // Tu diccionario de traducciones

  constructor(private googleTranslate: GoogleTranslationService, private lite: LiteApiService) {
    // Aquí podrías cargar tu diccionario si es estático,
    // o tener un método para cargarlo de forma asíncrona.
    // Por ejemplo: this.loadFacilitiesDictionary();
    this.lite.facilitiesData.subscribe(facilities=>{
      this.setFacilitiesDictionary(facilities.data);
    });
  }

  /**
   * Carga el diccionario de traducciones.
   * Esto podría ser una llamada HTTP o simplemente asignar un objeto.
   */
  public setFacilitiesDictionary(dictionary: FacilityDescription[]): void {
    this.facilitiesDictionary = dictionary;
  }

  getFacilityText(facility: Facility): Observable<string> {
    const facilityId = facility.facilityId;

    // 1. Si ya está en caché, devuelve el observable existente.
    if (this.facilityCache.has(facilityId)) {
      return this.facilityCache.get(facilityId)!.asObservable();
    }

    // 2. Crea un nuevo BehaviorSubject para la instalación y lo guarda en caché.
    const facilityText$ = new BehaviorSubject<string>(facility.name);
    this.facilityCache.set(facilityId, facilityText$);

    // 3. Intenta obtener la traducción del diccionario local primero.
    const dictionaryTranslation = this.getTranslationFromDictionary(facilityId);

    if (dictionaryTranslation) {
      facilityText$.next(dictionaryTranslation);
      return facilityText$.asObservable();
    }

    // 4. Si no hay en el diccionario, procede con Google Translate.
    // Usamos `pipe` con `tap` para actualizar el BehaviorSubject y luego devolver el observable.
    this.googleTranslate.translateV2(facility.name, 'es').pipe(
      switchMap(response => {
        const translatedText = response?.data?.translations?.[0]?.translatedText || facility.name;
        return of(translatedText); // Envuelve el resultado en un observable
      }),
      tap(translatedText => {
        // Actualiza el BehaviorSubject con la traducción obtenida
        facilityText$.next(translatedText);
      }),
      catchError(error => {
        console.error(`Translation failed for ID ${facilityId}:`, error);
        // En caso de error, aseguramos que el BehaviorSubject tenga el nombre original
        facilityText$.next(facility.name);
        return of(facility.name); // Devuelve un observable con el nombre original para no romper la cadena
      })
    ).subscribe(); // Suscribe para que la lógica se ejecute

    // 5. Devuelve el BehaviorSubject inmediatamente.
    // El valor se actualizará asíncronamente por el `subscribe` anterior.
    return facilityText$.asObservable();
  }

  private getTranslationFromDictionary(facilityId: number): string | null {
    if (!this.facilitiesDictionary) {
      //console.log("No dictionary available in service");
      return null;
    }

    const description = this.facilitiesDictionary.find(fac => fac.facility_id === facilityId);

    if (description) {
      const translation = description.translation.find(tr => tr.lang === "es");
      if (translation) {
        return translation.facility;
      }
      //console.log(`No Translation found for ID: ${facilityId} in dictionary`);
    } else {
      //console.log(`No Description found for ID: ${facilityId} in dictionary`);
    }
    return null;
  }
}
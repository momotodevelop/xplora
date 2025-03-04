import { Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { GoogleTranslationService } from './services/google-translation.service';

@Pipe({
  name: 'translate',
  pure: false // Permite la actualización de la vista cuando hay cambios en el observable
})
export class TranslatePipe implements PipeTransform {
  private lastText = '';
  private lastLang = '';
  private translation$ = new BehaviorSubject<string>('');

  constructor(private translationService: GoogleTranslationService) {}

  transform(value: string, targetLang: string, sourceLang?: string): string {
    if (!value || !targetLang) return value;

    // Evitar llamadas repetitivas si ya tenemos el mismo texto e idioma
    if (value === this.lastText && targetLang === this.lastLang) {
      return this.translation$.getValue();
    }

    this.lastText = value;
    this.lastLang = targetLang;

    this.translationService.translateV2(value, targetLang, sourceLang).pipe(
      switchMap(response => {
        const translatedText = response.data.translations[0]?.translatedText || value;
        this.translation$.next(translatedText);
        return this.translation$;
      }),
      catchError(() => {
        this.translation$.next(value); // En caso de error, devolver el texto original
        return this.translation$;
      })
    ).subscribe();

    return this.translation$.getValue();
  }
}
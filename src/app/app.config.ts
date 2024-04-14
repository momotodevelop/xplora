import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import localeEsMX from '@angular/common/locales/es-MX';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';

registerLocaleData(localeEsMX);

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideClientHydration(), provideAnimationsAsync(), provideAnimations(), { provide: LOCALE_ID, useValue: 'es-MX' }, { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }, provideHttpClient(withFetch())]
};

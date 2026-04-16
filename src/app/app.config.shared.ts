import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import localeEsMX from '@angular/common/locales/es-MX';
import { routes } from './app.routes';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { CurrencyPipe, DatePipe, TitleCasePipe, registerLocaleData } from '@angular/common';
import { PaymentMethodPipe } from './payment-method.pipe';
import { BookingStatusPipe } from './booking-status.pipe';
import { PaymentStatusPipe } from './payment-status.pipe';
import { BookingTypePipe } from './booking-type.pipe';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { firebaseConfig } from '../environments/environment';

registerLocaleData(localeEsMX);

export const appBaseConfig: ApplicationConfig = {
  providers: [
    { provide: 'googleTagManagerId', useValue: 'GTM-5DFGG63K' },
    provideRouter(routes),
    DatePipe,
    TitleCasePipe,
    CurrencyPipe,
    PaymentMethodPipe,
    BookingStatusPipe,
    PaymentStatusPipe,
    BookingTypePipe,
    { provide: LOCALE_ID, useValue: 'es-MX' },
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' },
    provideHttpClient(withFetch()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideStorage(() => getStorage())
  ]
};

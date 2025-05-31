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
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getAnalytics, provideAnalytics, ScreenTrackingService, UserTrackingService } from '@angular/fire/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, provideAppCheck } from '@angular/fire/app-check';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { provideLottieOptions } from 'ngx-lottie';
import player from 'lottie-web';

registerLocaleData(localeEsMX);

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({
      player: () => player,
    }),
    provideRouter(routes), 
    provideClientHydration(), 
    provideAnimationsAsync(), 
    provideAnimations(), 
    { provide: LOCALE_ID, useValue: 'es-MX' }, 
    { provide: MAT_DATE_LOCALE, useValue: 'es-MX' }, 
    provideHttpClient(withFetch()), 
    provideFirebaseApp(() => initializeApp({"projectId":"xploramxv2","appId":"1:1079047158992:web:f946cb0bdb10834d51b2d5","storageBucket":"xploramxv2.appspot.com","apiKey":"AIzaSyB85miz-WytOAUnzXi1zWtw96fD_v2bfn4","authDomain":"xploramxv2.firebaseapp.com","messagingSenderId":"1079047158992","measurementId":"G-NMEP31D4X8"})), 
    provideAuth(() => getAuth()), 
    provideAnalytics(() => getAnalytics()), 
    ScreenTrackingService, 
    UserTrackingService,
    provideFirestore(() => getFirestore()), provideFunctions(() => getFunctions()), provideMessaging(() => getMessaging()), provideStorage(() => getStorage()),
    provideAnimationsAsync()
  ]
};

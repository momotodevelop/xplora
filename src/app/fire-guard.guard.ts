import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Observable } from 'rxjs';

export const fireGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  return new Observable<boolean>((subscriber) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        subscriber.next(true);
        subscriber.complete();
      } else {
        router.navigate(['/entrar']);
        subscriber.next(false);
        subscriber.complete();
      }
    });
  });
};

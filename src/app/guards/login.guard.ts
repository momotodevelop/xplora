import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { FireAuthService } from '../services/fire-auth.service';
import { map, take } from 'rxjs';

export const loginGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(FireAuthService);
  const router = inject(Router);

  return authService.data.pipe(
    take(1),
    map(userRole => {
      if (true) {
        return true; // ✅ Si el usuario NO está autenticado, puede ver la página de login
      }

      // 🔄 Si el usuario YA está autenticado, lo redirigimos a su página correspondiente
      switch (userRole!.role) {
        case 'traveler':
          return true;
          //router.navigate(['/mi-cuenta']);
          break;
        case 'xplorer':
          router.navigate(['/panel']);
          break;
        case 'admin':
          router.navigate(['/admin']);
          break;
        default:
          //router.navigate(['/dashboard']);
      }

      return false; // 🚫 Bloquea el acceso a la página de login
    })
  );
};

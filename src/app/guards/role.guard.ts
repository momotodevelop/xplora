import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { FireAuthService } from '../services/fire-auth.service';
import { map, take } from 'rxjs';
import { SharedDataService } from '../services/shared-data.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(FireAuthService);
  const router = inject(Router);
  const shared = inject(SharedDataService);

  const allowedRoles: string[] = route.data['roles'] ?? []; // 📌 Asegura que siempre sea un array
  shared.setLoading(true);

  return authService.data.pipe(
    map(userRole => {
      shared.setLoading(false);
      // ✅ Si el usuario tiene un rol permitido, permitir acceso
      if (userRole?.role && allowedRoles.includes(userRole?.role)) {
        return true;
      }else{
        router.navigate(['/entrar']);
      }

      // 🔄 Si el usuario está autenticado pero no tiene el rol adecuado, redirigirlo
      if (userRole) {
        switch (userRole.role) {
          case 'traveler':
            router.navigate(['/mi-cuenta']);
            break;
          case 'xplorer':
            router.navigate(['/panel']);
            break;
          case 'admin':
            router.navigate(['/admin']);
            break;
          default:
            router.navigate(['/entrar']);
        }
      } else {
        // ❌ Usuario no autenticado, enviarlo a login
        router.navigate(['/entrar']);
      }

      return false;
    })
  );
};

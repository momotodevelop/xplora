import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { FireBookingService } from '../services/fire-booking.service';

export const deferredPlanGuard: CanActivateFn = route => {
  const bookingId = route.paramMap.get('bookingID');
  const bookings = inject(FireBookingService);
  const router = inject(Router);

  if (!bookingId) {
    return router.createUrlTree(['/inicio']);
  }

  return bookings.getBooking(bookingId).pipe(
    map(booking => booking.payment?.deferredPlan
      ? true
      : router.createUrlTree(['/confirmacion', bookingId])),
    catchError(() => of(router.createUrlTree(['/inicio'])))
  );
};

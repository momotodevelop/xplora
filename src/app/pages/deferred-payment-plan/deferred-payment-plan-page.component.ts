import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { FireBookingService } from '../../services/fire-booking.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { SharedDataService } from '../../services/shared-data.service';
import { SiteIdentityService } from '../../services/site-identity.service';
import { FirebaseBooking } from '../../types/booking.types';
import { DeferredPaymentComponent } from '../make-payment/deferred-payment/deferred-payment.component';

@Component({
  selector: 'app-deferred-payment-plan-page',
  standalone: true,
  imports: [CommonModule, RouterLink, DeferredPaymentComponent],
  templateUrl: './deferred-payment-plan-page.component.html',
  styleUrl: './deferred-payment-plan-page.component.scss'
})
export class DeferredPaymentPlanPageComponent implements OnInit {
  booking?: FirebaseBooking;
  loadError = '';
  private readonly isBrowser: boolean;
  readonly site = this.siteIdentity.config;

  constructor(
    private route: ActivatedRoute,
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    private siteIdentity: SiteIdentityService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.shared.changeHeaderType('dark');
    this.shared.setLoading(true);
    this.meta.setMeta({
      title: `${this.site.brand.name} || Plan de pagos`,
      description: `Consulta el calendario, los abonos realizados y el saldo pendiente de tu plan de pagos con ${this.site.brand.name}.`,
      image: '/assets/img/banner-generico.jpg'
    });

    if (!this.isBrowser) {
      this.shared.setLoading(false);
      return;
    }

    this.route.params.pipe(
      map(params => String(params['bookingID'] ?? '')),
      switchMap(bookingId => this.bookings.watchBooking(bookingId))
    ).subscribe({
      next: booking => {
        if (!booking.payment?.deferredPlan) {
          this.loadError = 'Esta reservación no tiene un plan de pagos diferidos.';
          this.shared.setLoading(false);
          return;
        }
        this.booking = booking;
        this.loadError = '';
        this.shared.setLoading(false);
      },
      error: () => {
        this.loadError = 'No pudimos cargar el plan de pagos. Verifica el enlace e inténtalo nuevamente.';
        this.shared.setLoading(false);
      }
    });
  }
}

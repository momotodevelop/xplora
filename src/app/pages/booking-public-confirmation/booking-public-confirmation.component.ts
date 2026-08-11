import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, of, switchMap } from 'rxjs';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { FireBookingService } from '../../services/fire-booking.service';
import { SharedDataService } from '../../services/shared-data.service';
import { DeferredPaymentPlan, FirebaseBooking, FlightFirebaseBooking } from '../../types/booking.types';
import { CommonModule } from '@angular/common';
import { FlightConfirmationSidebarComponent } from './flight-confirmation-sidebar/flight-confirmation-sidebar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckDouble, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { WhatsAppUrlManagerService } from '../../services/whatsapp-url-manager.service';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { VoucherTransformService } from '../../services/voucher-transform.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { BookingDisplayService, BookingDisplaySummary } from '../../services/booking-display.service';
import { getToneClass } from '../../utils/booking-display.utils';
import { SiteIdentityService } from '../../services/site-identity.service';
import { DeferredPaymentPlanService } from '../../services/deferred-payment-plan.service';

@Component({
  selector: 'app-booking-public-confirmation',
  imports: [CommonModule, FlightConfirmationSidebarComponent, FontAwesomeModule],
  templateUrl: './booking-public-confirmation.component.html',
  styleUrl: './booking-public-confirmation.component.scss'
})
export class BookingPublicConfirmationComponent {
  private readonly isBrowser: boolean;
  readonly site = this.siteIdentity.config;
  readonly contactWhatsAppHref: string;

  constructor(
    public bookingHandler: BookingHandlerService,
    private route: ActivatedRoute, 
    private sharedService: SharedDataService,
    private fireBooking: FireBookingService,
    private wa: WhatsAppUrlManagerService,
    private voucher: VoucherTransformService,
    private meta: MetaHandlerService,
    private display: BookingDisplayService,
    private siteIdentity: SiteIdentityService,
    private deferredPlans: DeferredPaymentPlanService,
    @Inject(PLATFORM_ID) platformId: Object
  ){
    this.isBrowser = isPlatformBrowser(platformId);
    this.contactWhatsAppHref = this.wa.getUrlFromTemplate('contactoDirecto');
  }
  booking?:FirebaseBooking;
  summary?: BookingDisplaySummary;
  pnr!:string;
  total:number=0;
  originalPrice=0;
  pendingAmount=0;
  loadError = '';
  iconConfirmed=faCheckDouble;
  iconPending=faExclamationTriangle;
  iconCanceled=faTimes;
  iconWhatsApp=faWhatsapp;
  ngOnInit(): void {
    this.meta.setMeta({
      title: `${this.site.brand.name} || Confirmación de Reservación`,
      description: `Consulta el estado de tu reservación y los detalles de pago en ${this.site.brand.name}.`,
      image: '/assets/img/banner-generico.jpg'
    });
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.sharedService.setBookingMode(true);

    if (!this.isBrowser) {
      this.sharedService.setLoading(false);
      return;
    }

    this.sharedService.setLoading(true);
    this.route.params.pipe(
      map(paramsData => (paramsData as {bookingID:string}).bookingID),
      switchMap(bookingID => this.fireBooking.getBooking(bookingID).pipe(
        catchError(error => {
          console.error('Error al cargar la reservación pública', error);
          this.loadError = 'No pudimos cargar esta confirmación. Verifica el enlace o contáctanos para recibir ayuda.';
          this.sharedService.setLoading(false);
          return of(undefined);
        })
      ))
    ).subscribe(booking => {
      if (!booking) {
        return;
      }

      this.loadError = '';
      this.booking = booking;
      this.summary = this.display.buildSummary(booking);
      this.pnr = booking.bookingID?.slice(-6) ?? '';
      this.total = booking.payment?.totalDue ?? booking.payment?.amount ?? 0;
      this.pendingAmount = Math.max(this.total - (booking.payment?.payed ?? 0), 0);
      this.originalPrice = booking.payment?.originalAmount ?? this.total;

      if (booking.type === 'FLIGHT' && booking.flightDetails) {
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
      }

      this.sharedService.setLoading(false);
      const bookingType = booking.type === 'HOTEL' ? 'Hotel' : 'Vuelo';
      const image = booking.type === 'HOTEL'
        ? (booking.hotelDetails?.hotel?.image || '/assets/img/banner-generico.jpg')
        : 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fflights.jpg?alt=media&token=0defc707-55a6-4886-ac34-0507d3089aa3';
      this.meta.setMeta({
        title: `${this.site.brand.name} || Confirmación de ${bookingType}`,
        description: `Revisa el estado de tu reservación de ${bookingType.toLowerCase()} y los detalles de pago en ${this.site.brand.name}.`,
        image
      });
      console.log(this.voucher.transformFirebaseBookingToVoucher(booking));
    });
  }
  toFlightBooking(booking: FirebaseBooking):FlightFirebaseBooking{
    return booking as FlightFirebaseBooking;
  }
  getBadgeClass(tone: BookingDisplaySummary['lifecycleTone']): string {
    return getToneClass(tone);
  }

  getPaymentUrl(): string {
    return this.booking?.payment?.deferredPlan
      ? `/plan-pagos/${this.booking.bookingID}`
      : `/reservar/realizar-pago/${this.booking?.bookingID}`;
  }

  get deferredPlan(): DeferredPaymentPlan | undefined {
    return this.booking?.payment?.deferredPlan;
  }

  getDeferredFrequencyLabel(): string {
    return this.deferredPlan ? this.deferredPlans.getFrequencyLabel(this.deferredPlan.frequency) : '';
  }

  getDeferredPlanStatusLabel(): string {
    switch (this.deferredPlan?.status) {
      case 'PREAPPROVED':
      case 'PENDING_APPROVAL':
        return (this.booking?.payment?.payed ?? 0) >= this.deferredPlan.downPaymentAmount
          ? 'Activo'
          : 'Preaprobado · pendiente de anticipo';
      case 'APPROVED':
        return 'Aprobado';
      case 'ACTIVE':
        return 'Activo';
      case 'COMPLETED':
        return 'Liquidado';
      case 'REJECTED':
        return 'No aprobado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return '';
    }
  }

  getDeferredPlanVisualStatus(): string {
    if (
      ['PREAPPROVED', 'PENDING_APPROVAL'].includes(this.deferredPlan?.status ?? '')
      && (this.booking?.payment?.payed ?? 0) >= (this.deferredPlan?.downPaymentAmount ?? Infinity)
    ) {
      return 'ACTIVE';
    }
    return this.deferredPlan?.status ?? '';
  }

  toDate(value: unknown): Date | null {
    if (!value) return null;
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
  }
}

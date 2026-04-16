import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { FirebaseBooking } from '../../../../types/booking.types';
import { MatIconModule } from '@angular/material/icon';
import { AdminBookingQuickDetailsComponent } from './admin-booking-quick-details/admin-booking-quick-details.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';
import { BookingDisplayService, BookingDisplaySummary } from '../../../../services/booking-display.service';
import { getToneClass } from '../../../../utils/booking-display.utils';

@Component({
  selector: 'app-admin-bookings',
  imports: [MatExpansionModule, MatIconModule, FontAwesomeModule, CommonModule, FormsModule, AdminBookingQuickDetailsComponent],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss'
})
export class AdminBookingsComponent implements OnInit {
  bookingList: FirebaseBooking[] = [];
  filteredBookingList: FirebaseBooking[] = [];
  headerHeight:number = 0;
  lastDoc: any = null;
  searchTerm = '';
  typeFilter = 'ALL';
  statusFilter = 'ALL';
  paymentStatusFilter = 'ALL';
  paymentMethodFilter = 'ALL';
  readonly typeOptions = ['ALL', 'FLIGHT', 'HOTEL', 'TRANSPORTATION', 'ACTIVITY', 'PACKAGE'];
  readonly statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'VALIDATING', 'HOLD', 'CANCELED', 'REJECTED'];
  readonly paymentStatusOptions = ['ALL', 'PENDING', 'COMPLETED', 'VALIDATING', 'FAILED', 'CANCELED'];
  readonly paymentMethodOptions = ['ALL', 'CARD', 'PAYPAL', 'SPEI', 'CASH'];
  private readonly bookingSummaries = new Map<string, BookingDisplaySummary>();

  constructor(
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    private display: BookingDisplayService
  ){
    this.shared.setLoading(true);
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
  }
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Reservaciones',
      description: 'Gestiona y revisa las reservaciones de clientes en el panel administrativo de Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.loadBookings();
  }
  private loadBookings(): void {
    this.bookings.getAllBookings({requirePayment: true}).subscribe(bookings => {
      this.bookingList = bookings.bookings;
      this.lastDoc = bookings.lastDoc;
      this.bookingSummaries.clear();
      this.applyFilters();
      this.shared.setLoading(false);
    });
  }

  loadMoreBookings(): void {
    if (this.lastDoc) {
      this.shared.setLoading(true);
      this.bookings.getAllBookings({ startAfterDoc: this.lastDoc, requirePayment: true }).subscribe(bookings => {
        this.bookingList = [...this.bookingList, ...bookings.bookings];
        this.lastDoc = bookings.lastDoc;
        this.bookingSummaries.clear();
        this.applyFilters();
        this.shared.setLoading(false);
      });
    }
  }

  applyFilters(): void {
    const query = this.normalize(this.searchTerm);

    this.filteredBookingList = this.bookingList.filter(booking => {
      const summary = this.getSummary(booking);
      const matchesSearch = !query || [
        booking.bookingID,
        summary.shortReference,
        summary.travelerName,
        summary.routeLabel,
        booking.contact?.email,
        booking.contact?.phone,
        booking.pnr
      ].some(value => this.normalize(value).includes(query));

      const matchesType = this.typeFilter === 'ALL' || booking.type === this.typeFilter;
      const matchesStatus = this.statusFilter === 'ALL' || booking.status === this.statusFilter;
      const matchesPaymentStatus = this.paymentStatusFilter === 'ALL' || booking.payment?.status === this.paymentStatusFilter;
      const matchesPaymentMethod = this.paymentMethodFilter === 'ALL' || booking.payment?.method === this.paymentMethodFilter;

      return matchesSearch && matchesType && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
    });
  }

  getSummary(booking: FirebaseBooking): BookingDisplaySummary {
    const key = booking.bookingID ?? Math.random().toString(36);
    const existing = this.bookingSummaries.get(key);
    if (existing) {
      return existing;
    }

    const summary = this.display.buildSummary(booking);
    this.bookingSummaries.set(key, summary);
    return summary;
  }

  getBadgeClass(tone: BookingDisplaySummary['lifecycleTone']): string {
    return getToneClass(tone);
  }

  getOperationalKpis() {
    const summaries = this.filteredBookingList.map(booking => this.getSummary(booking));

    return {
      total: this.filteredBookingList.length,
      pendingAction: summaries.filter(summary => summary.canPay || summary.lifecycleLabel === 'Pago en validación').length,
      pendingBalance: summaries.reduce((acc, summary) => acc + summary.pricing.balance, 0),
      confirmed: summaries.filter(summary => summary.lifecycleLabel === 'Confirmada').length
    };
  }

  getBookingIcon(type: FirebaseBooking['type']): string {
    switch (type) {
      case 'FLIGHT':
        return 'flight';
      case 'HOTEL':
        return 'local_hotel';
      case 'ACTIVITY':
        return 'local_activity';
      case 'TRANSPORTATION':
        return 'directions_bus';
      case 'PACKAGE':
        return 'inventory_2';
      default:
        return 'book_online';
    }
  }

  private normalize(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}

import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { FireAuthService } from '../../../../services/fire-auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { LocationNamePipe } from '../../../../city-name.pipe';
import { BookingQuickDetailsComponent } from './booking-quick-details/booking-quick-details.component';
import { TravelerFooterComponent } from '../traveler-footer/traveler-footer.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';
import { FirebaseBooking } from '../../../../types/booking.types';
import { BookingDisplayService, BookingDisplaySummary } from '../../../../services/booking-display.service';
import { getBookingStatusLabel, getToneClass } from '../../../../utils/booking-display.utils';

@Component({
  selector: 'app-traveler-bookings',
  imports: [MatExpansionModule, MatIconModule, FontAwesomeModule, CommonModule, FormsModule, BookingQuickDetailsComponent, TravelerFooterComponent],
  templateUrl: './traveler-bookings.component.html',
  styleUrl: './traveler-bookings.component.scss',
  providers: [LocationNamePipe]
})
export class TravelerBookingsComponent implements OnInit {
  bookingList: FirebaseBooking[] = [];
  filteredBookingList: FirebaseBooking[] = [];
  headerHeight:number = 0;
  searchTerm = '';
  statusFilter = 'ALL';
  readonly statusOptions = ['ALL', 'PENDING', 'CONFIRMED', 'VALIDATING', 'HOLD', 'CANCELED'];
  private readonly bookingSummaries = new Map<string, BookingDisplaySummary>();

  constructor(
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private auth: FireAuthService,
    private meta: MetaHandlerService,
    private display: BookingDisplayService
  ){
    this.shared.setLoading(true);
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
    this.auth.user.subscribe(user => {
      if (user) {
        this.bookings.getBookingsByUser(user.uid).subscribe(bookings => {
          this.bookingList = bookings;
          this.bookingSummaries.clear();
          this.applyFilters();
          this.shared.setLoading(false);
        });
      } else {
        this.shared.setLoading(false);
      }
    });
  }

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Reservaciones',
      description: 'Revisa el historial y estado de tus reservaciones en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
  }

  applyFilters(): void {
    const query = this.normalize(this.searchTerm);
    this.filteredBookingList = this.bookingList.filter(booking => {
      const summary = this.getSummary(booking);
      const matchesSearch = !query || [
        booking.bookingID,
        summary.shortReference,
        summary.routeLabel,
        summary.travelerName
      ].some(value => this.normalize(value).includes(query));
      const matchesStatus = this.statusFilter === 'ALL' || booking.status === this.statusFilter;
      return matchesSearch && matchesStatus;
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
      default:
        return 'book_online';
    }
  }

  getOverview() {
    return {
      total: this.filteredBookingList.length,
      pending: this.filteredBookingList.filter(booking => this.getSummary(booking).canPay).length,
      confirmed: this.filteredBookingList.filter(booking => booking.status === 'CONFIRMED').length
    };
  }

  getStatusFilterLabel(option: string): string {
    if (option === 'ALL') {
      return 'Todos';
    }

    return getBookingStatusLabel(option as FirebaseBooking['status']);
  }

  private normalize(value: unknown): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}

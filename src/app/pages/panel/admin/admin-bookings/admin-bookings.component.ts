import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TravelerFooterComponent } from '../../traveler/traveler-footer/traveler-footer.component';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { faExclamationTriangle, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FirebaseBooking } from '../../../../types/booking.types';
import { MatIconModule } from '@angular/material/icon';
import { PaymentMethodPipe } from '../../../../payment-method.pipe';
import { AdminBookingQuickDetailsComponent } from './admin-booking-quick-details/admin-booking-quick-details.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

@Component({
  selector: 'app-admin-bookings',
  imports: [MatExpansionModule, MatIconModule, FontAwesomeModule, CommonModule, AdminBookingQuickDetailsComponent, TravelerFooterComponent, PaymentMethodPipe],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss'
})
export class AdminBookingsComponent implements OnInit {
  bookingList: FirebaseBooking[] = [];
  pendingIcon = faExclamationTriangle;
  confirmedIcon = faCheckCircle;
  canceledIcon = faExclamationCircle;
  headerHeight:number = 0;
  lastDoc:any = null;
  constructor(
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private meta: MetaHandlerService
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
      this.shared.setLoading(false);
    });
  }
  loadMoreBookings(): void {
    if (this.lastDoc) {
      this.shared.setLoading(true);
      this.bookings.getAllBookings(this.lastDoc).subscribe(bookings => {
        this.bookingList = [...this.bookingList, ...bookings.bookings];
        //this.bookingList[0].payment?.===""
        this.lastDoc = bookings.lastDoc;
        this.shared.setLoading(false);
      });
    }
  }
}

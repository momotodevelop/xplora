import { Component, OnInit } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { FireAuthService } from '../../../../services/fire-auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationCircle, faExclamationTriangle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle } from '@fortawesome/free-regular-svg-icons';
import { CommonModule } from '@angular/common';
import { LocationNamePipe } from '../../../../city-name.pipe';
import { BookingQuickDetailsComponent } from './booking-quick-details/booking-quick-details.component';
import { TravelerFooterComponent } from '../traveler-footer/traveler-footer.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

@Component({
  selector: 'app-traveler-bookings',
  imports: [MatExpansionModule, MatIconModule, FontAwesomeModule, CommonModule, BookingQuickDetailsComponent, TravelerFooterComponent],
  templateUrl: './traveler-bookings.component.html',
  styleUrl: './traveler-bookings.component.scss',
  providers: [LocationNamePipe]
})
export class TravelerBookingsComponent implements OnInit {
  bookingList: any[] = [];
  pendingIcon = faExclamationTriangle;
  confirmedIcon = faCheckCircle;
  canceledIcon = faExclamationCircle;
  headerHeight:number = 0;
  constructor(
    private bookings: FireBookingService,
    private shared: SharedDataService,
    private auth: FireAuthService,
    private meta: MetaHandlerService
  ){
    this.shared.setLoading(true);
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
    this.auth.user.subscribe(user => {
      if (user) {
        this.bookings.getBookingsByUser(user.uid).subscribe(bookings => {
          this.bookingList = bookings;
          this.shared.setLoading(false);
          bookings[0].hotelDetails!.hotel!.name;
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
}

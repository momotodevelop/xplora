import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedDataService } from '../../services/shared-data.service';
import { XploraApiService } from '../../services/xplora-api.service';
import { combineLatest, map } from 'rxjs';
import { ConfirmationSidebarComponent } from '../booking-process/confirmation-sidebar/confirmation-sidebar.component';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { XploraPromosService } from '../../services/xplora-promos.service';
import { XploraFlightBooking } from '../../types/xplora-api.types';
import { PaymentComponent } from '../booking-process/payment/payment.component';
import { FireBookingService } from '../../services/fire-booking.service';
import { FirebaseBooking, FlightFirebaseBooking } from '../../types/booking.types';
import { SpeiPaymentComponent } from './spei-payment/spei-payment.component';

@Component({
    selector: 'app-make-payment',
    imports: [ConfirmationSidebarComponent, PaymentComponent, SpeiPaymentComponent],
    templateUrl: './make-payment.component.html',
    styleUrl: './make-payment.component.scss'
})
export class MakePaymentComponent implements OnInit {
  bookingID!:string;
  booking!: FlightFirebaseBooking;
  constructor(
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    public bookingHandler: BookingHandlerService,
    private promos: XploraPromosService,
    private fireBooking: FireBookingService
  ){}

  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q]) => {
      const params:{bookingID:string} = p as {bookingID:string};
      const queryParams:{promo?:string} = q as {promo?:string};
      this.bookingID = params.bookingID;
      this.fireBooking.getBooking(this.bookingID).subscribe(booking=>{
        console.log(booking);
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.booking = booking as FlightFirebaseBooking;
      });
    });
  }
}

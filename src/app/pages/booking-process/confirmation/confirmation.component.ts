import { Component, OnInit } from '@angular/core';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import { ActivatedRoute } from '@angular/router';
import { SharedDataService } from '../../../services/shared-data.service';
import { XploraApiService } from '../../../services/xplora-api.service';
import { ConfirmationSidebarComponent } from '../confirmation-sidebar/confirmation-sidebar.component';
import { Charge } from '../booking-sidebar/booking-sidebar.component';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs';
import { FlightFirebaseBooking } from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';

@Component({
    selector: 'app-confirmation',
    imports: [ConfirmationSidebarComponent, CommonModule],
    templateUrl: './confirmation.component.html',
    styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit {
  constructor(
    public bookingHandler: BookingHandlerService,
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    private fireBooking: FireBookingService
  ){}
  booking?:FlightFirebaseBooking;
  pnr!:string;
  total:number=0;
  originalPrice=0;
  ngOnInit(): void {
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.sharedService.settBookingMode(true);
    this.route.params.subscribe(paramsData=>{
      const params:{bookingID:string} = paramsData as {bookingID:string};
      this.fireBooking.getBooking(params.bookingID).subscribe(booking=>{
        this.booking=booking as FlightFirebaseBooking;
        this.pnr = booking.bookingID!.slice(-6);
        this.total = booking.payment!.totalDue;
        this.originalPrice = booking.payment!.originalAmount;
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.sharedService.setLoading(false);
        if(booking.contact!.phone){}
      })
    });
  }
}

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { FireBookingService } from '../../services/fire-booking.service';
import { SharedDataService } from '../../services/shared-data.service';
import { XploraApiService } from '../../services/xplora-api.service';
import { FirebaseBooking, FlightFirebaseBooking } from '../../types/booking.types';
import { CommonModule } from '@angular/common';
import { FlightConfirmationSidebarComponent } from './flight-confirmation-sidebar/flight-confirmation-sidebar.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckDouble, faExclamation, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { WhatsAppUrlManagerService } from '../../services/whatsapp-url-manager.service';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { VoucherTransformService } from '../../services/voucher-transform.service';
import { MetaHandlerService } from '../../services/meta-handler.service';

@Component({
  selector: 'app-booking-public-confirmation',
  imports: [CommonModule, FlightConfirmationSidebarComponent, FontAwesomeModule],
  templateUrl: './booking-public-confirmation.component.html',
  styleUrl: './booking-public-confirmation.component.scss'
})
export class BookingPublicConfirmationComponent {
  constructor(
    public bookingHandler: BookingHandlerService,
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    private fireBooking: FireBookingService,
    private wa: WhatsAppUrlManagerService,
    private voucher: VoucherTransformService,
    private meta: MetaHandlerService
  ){}
  booking?:FirebaseBooking;
  pnr!:string;
  total:number=0;
  originalPrice=0;
  pendingAmount=0;
  iconConfirmed=faCheckDouble;
  iconPending=faExclamationTriangle;
  iconCanceled=faTimes;
  iconWhatsApp=faWhatsapp;
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Confirmación de Reservación',
      description: 'Consulta el estado de tu reservación y los detalles de pago en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.sharedService.setBookingMode(true);
    this.route.params.subscribe(paramsData=>{
      const params:{bookingID:string} = paramsData as {bookingID:string};
      this.fireBooking.getBooking(params.bookingID).subscribe(booking=>{
        this.booking=booking;
        this.pnr = booking.bookingID!.slice(-6);
        this.total = booking.payment!.totalDue;
        this.pendingAmount = this.total - booking.payment!.payed;
        this.originalPrice = booking.payment!.originalAmount;
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.sharedService.setLoading(false);
        const bookingType = booking.type === 'HOTEL' ? 'Hotel' : 'Vuelo';
        const image = booking.type === 'HOTEL'
          ? (booking.hotelDetails?.hotel?.image || '/assets/img/banner-generico.jpg')
          : 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fflights.jpg?alt=media&token=0defc707-55a6-4886-ac34-0507d3089aa3';
        this.meta.setMeta({
          title: `Xplora Travel || Confirmación de ${bookingType}`,
          description: `Revisa el estado de tu reservación de ${bookingType.toLowerCase()} y los detalles de pago en Xplora Travel.`,
          image
        });
        console.log(booking);
        console.log(this.voucher.transformFirebaseBookingToVoucher(booking));
      })
    });
  }
  toFlightBooking(booking: FirebaseBooking):FlightFirebaseBooking{
    return booking as FlightFirebaseBooking;
  }
  openContactWhatsApp(): void {
    this.wa.redirectToMessage('contactoDirecto');
  }
}

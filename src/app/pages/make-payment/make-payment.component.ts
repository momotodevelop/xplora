import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedDataService } from '../../services/shared-data.service';
import { XploraApiService } from '../../services/xplora-api.service';
import { combineLatest, map } from 'rxjs';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { XploraPromosService } from '../../services/xplora-promos.service';
import { FireBookingService } from '../../services/fire-booking.service';
import { FlightFirebaseBooking } from '../../types/booking.types';
import { SpeiPaymentComponent } from './spei-payment/spei-payment.component';
import { UploadPaymentReceiptComponent } from '../../shared/upload-payment-receipt/upload-payment-receipt.component';
import { CashPaymentComponent } from './cash-payment/cash-payment.component';
import { Title } from '@angular/platform-browser';
import { CardPaymentComponent } from './card-payment/card-payment.component';
import { CardTransactionListComponent } from './card-payment/card-transaction-list/card-transaction-list.component';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-make-payment',
    imports: [SpeiPaymentComponent, CashPaymentComponent, UploadPaymentReceiptComponent, CardPaymentComponent, CardTransactionListComponent, CommonModule],
    templateUrl: './make-payment.component.html',
    styleUrl: './make-payment.component.scss'
})
export class MakePaymentComponent implements OnInit {
  bookingID!:string;
  booking!: FlightFirebaseBooking;
  constructor(
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    public sharedService: SharedDataService,
    public bookingHandler: BookingHandlerService,
    private promos: XploraPromosService,
    private fireBooking: FireBookingService,
    private meta: MetaHandlerService
  ){}

  ngOnInit(): void {
    this.sharedService.setLoading(true);
    this.meta.setMeta({
      title: "Xplora Travel || Completar Reservación || Realizar Pago",
      description: "Completa el pago de tu reservación de vuelo en Xplora Travel de forma segura y sencilla. Elige tu método de pago preferido y asegura tu lugar en el viaje.",
      image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fpayment-cash.jpg?alt=media&token=ef52cdf2-3de6-42b1-94bc-9dc8be9f78f3"
    });
    this.sharedService.toggleHideNav(false);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      //console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.sharedService.setBookingMode(true);
    this.sharedService.footerHeight.subscribe(height=>{
      console.log(height);
    })
    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q]) => {
      const params:{bookingID:string} = p as {bookingID:string};
      const queryParams:{promo?:string} = q as {promo?:string};
      this.bookingID = params.bookingID;
      this.fireBooking.getBooking(this.bookingID).subscribe(booking=>{
        //console.log(booking);
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.booking = booking as FlightFirebaseBooking;
        this.sharedService.setLoading(false);
        if(booking.payment?.method === "CASH"){
            const payTotal = booking.payment.totalDue-booking.payment.payed;
            this.meta.setMeta({
              title: "Xplora Travel || Pago en Efectivo || Completar Reservación",
              description: "Realiza el pago de tu reservación de vuelo en efectivo de forma segura y sencilla en Xplora Travel. Sigue las instrucciones para completar tu pago y asegurar tu lugar.",
              image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fpayment-cash.jpg?alt=media&token=ef52cdf2-3de6-42b1-94bc-9dc8be9f78f3",
              ogType: "paymeny.link",
              payment: {
                amount: payTotal,
                currency: 'MXN',
                status: payTotal>0?"PENDIENTE":"PAGADO",
                description: "Pagar Reservación "+booking.bookingID?.slice(-6).toUpperCase()+" en Efectivo",
                expiresAt: booking.payment.paymentLimit?.toString(),
                id: this.bookingID
              }

            });
        }else if(booking.payment?.method === "SPEI"){
            const payTotal = booking.payment.totalDue-booking.payment.payed;
            this.meta.setMeta({
              title: "Xplora Travel || Pago por Transferencia SPEI || Completar Reservación",
              description: "Realiza el pago de tu reservación de vuelo mediante transferencia SPEI de forma segura y sencilla en Xplora Travel. Sigue las instrucciones para completar tu pago y asegurar tu lugar.",
              image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fpayment-spei.jpg?alt=media&token=bb54c4ca-cd94-4e1f-9680-321676074d04",
              ogType: "paymeny.link",
              payment: {
                amount: payTotal,
                currency: 'MXN',
                status: payTotal>0?"PENDIENTE":"PAGADO",
                description: "Pagar Reservación "+booking.bookingID?.slice(-6).toUpperCase()+" por Transferencia SPEI",
                expiresAt: booking.payment.paymentLimit?.toString(),
                id: this.bookingID
              }
            });
        }
      });
    });
  }
  
}

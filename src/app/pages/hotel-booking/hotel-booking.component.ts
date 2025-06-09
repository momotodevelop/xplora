import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { ActivatedRoute } from '@angular/router';
import { FireBookingService } from '../../services/fire-booking.service';
import { HotelBookingSidebarComponent } from './hotel-booking-sidebar/hotel-booking-sidebar.component';
import { FirebaseBooking } from '../../types/booking.types';
import { HolderData, HotelBookingRoomDataComponent } from './hotel-booking-room-data/hotel-booking-room-data.component';
import { ContactData, HotelBookingContactDataComponent } from './hotel-booking-contact-data/hotel-booking-contact-data.component';
import { HotelBookingPaymentInfoComponent, PaymentCardData } from './hotel-booking-payment-info/hotel-booking-payment-info.component';
import { BookingCreationLoaderComponent, Step, Line } from '../../shared/booking-creation-loader/booking-creation-loader.component';
import { MatButtonModule } from '@angular/material/button';
import { Promo, XploraPromosService } from '../../services/xplora-promos.service';
import { combineLatest } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoardTypePipe } from '../../board-type-pipe.pipe';
import { XploraPaymentsService } from '../../services/xplora-payments.service';
import { StoredCardPaymentData, XploraCardServicesService } from '../../services/xplora-card-services.service';
import { faCcAmex, faCcMastercard, faCcVisa } from '@fortawesome/free-brands-svg-icons';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { Charge } from '../booking-process/booking-sidebar/booking-sidebar.component';
import { Timestamp } from 'firebase/firestore';

interface Params{
  bookingID:string;
}
interface OldHotelCharge{
  total:number;
  currency:string;
  description:string;
  secondLine?:string;
  thirdLine?:string;
}
@Component({
  selector: 'app-hotel-booking',
  imports: [
    HotelBookingSidebarComponent, 
    HotelBookingRoomDataComponent, 
    HotelBookingContactDataComponent,
    HotelBookingPaymentInfoComponent,
    BookingCreationLoaderComponent,
    MatButtonModule,
    MatSnackBarModule,
    BoardTypePipe,
    CurrencyPipe,
    TitleCasePipe
  ],
  templateUrl: './hotel-booking.component.html',
  styleUrl: './hotel-booking.component.scss',
  providers: [BoardTypePipe, CurrencyPipe, TitleCasePipe]
})
export class HotelBookingComponent implements OnInit {
  discountFixed:number = 20;
  constructor(
    private shared: SharedDataService, 
    private route: ActivatedRoute, 
    private fireBooking: FireBookingService,
    private promos: XploraPromosService,
    private sb: MatSnackBar,
    private boardType: BoardTypePipe,
    private cards: XploraCardServicesService,
    private date: DatePipe,
    private title: TitleCasePipe
  ) { }
  booking!:FirebaseBooking;
  guests!:{adults: number, childrens: number};
  total:number=0;
  loading:boolean=false;
  roomsHolders:HolderData[]=[];
  contactData?:ContactData;
  paymentType:"NOW"|"DELAYED"="NOW";
  paymentMethod:"CARD"|"CASH"|"SPEI"="CARD";
  cardData?:PaymentCardData;
  charges:Charge[]=[];
  promo?:Promo;
  dates:[Date, Date] = [new Date(), new Date()];
  dN:{d:number, n:number} = {d:0, n:0};
  loaderSteps?:Step[];
  ngOnInit(): void {
    this.shared.setLoading(true);
    this.shared.settBookingMode(true);
    this.shared.changeHeaderType("dark");
    combineLatest([this.route.params, this.route.queryParams]).subscribe(([p, q])=>{
      const params = p as Params;
      const query = q as {promo?:string};
      this.fireBooking.getBooking(params.bookingID).subscribe(b=>{
        console.log(b);
        if(b){
          this.booking = b;
          this.dN = this.calcularDiasNoches((b.hotelDetails!.checkin as firebase.default.firestore.Timestamp).toDate(), (b.hotelDetails!.checkout as firebase.default.firestore.Timestamp).toDate());
          this.dates = [(b.hotelDetails!.checkin as firebase.default.firestore.Timestamp).toDate(), (b.hotelDetails!.checkout as firebase.default.firestore.Timestamp).toDate()];
          console.log(this.booking.hotelDetails);
          this.shared.setLoading(false);
          if(b.hotelDetails){
            if(b.hotelDetails.offer){
              this.charges = b.hotelDetails.offer.rates.map(rate=>{
                return {
                  amount: rate.retailRate.suggestedSellingPrice.amount,
                  currency: rate.retailRate.suggestedSellingPrice.currency,
                  description: rate.name
                }
              });
              //this.total = b.hotelDetails.offer.suggestedSellingPrice.amount;
              this.updatePrices();
            }
          }
          const guests: {adults: number, childrens: number}=b.hotelDetails!.accomodation.map(accomodation=>{
            return {
              adults: accomodation.adults,
              childrens: accomodation.childrens ?? 0
            }
          }).reduce((acc,item)=>{
            return {
              adults: acc.adults + item.adults,
              childrens: acc.childrens + item.childrens
            }
          });
          this.guests = guests;
        }
      });
      if(query.promo){
        this.verifyPromo(query.promo);
      }
    })
  }
  roomsChange(rooms: HolderData[]){
    this.roomsHolders = rooms;
  }
  contactChange(contact: ContactData){
    this.contactData = contact;
    console.log(contact);
  }
  paymentTypeChange(paymentType: "NOW" | "DELAYED"){
    this.paymentType = paymentType;
    console.log(paymentType);
    this.updatePrices();
  }
  paymentMethodChange(paymentMethod: "CARD" | "CASH" | "SPEI"){
    this.paymentMethod = paymentMethod;
    console.log(paymentMethod);
  }
  cardDataChange(cardData: PaymentCardData){
    this.cardData = cardData;
    console.log(cardData);
  }
  verifyPromo(promoCode:string){
    this.promos.getPromoByCode(promoCode).subscribe(promo=>{
      console.log(promo);
      if(promo!==undefined){
        if(promo.allowedProducts==='hotels'){
          this.sb.open("Promoción aplicada", "OK", {duration: 3000});
          this.promo = promo;
          this.updatePrices();
        }else{
          this.sb.open("Lo sentimos, la promoción que ingresaste no es válida para hoteles.", "OK", {duration: 3000});
        }
      }else{
        this.sb.open("Lo sentimos, la promoción que ingresaste no existe o no está disponible.", "OK", {duration: 3000});
      }
    });
  }
  confirmBooking(){
    console.log("Confirmando reserva...");
    this.loading = true;
    const updateData:Partial<FirebaseBooking> = {
      status: "PENDING",
      created: new Timestamp(new Date().getTime(), 0),
      payment: {
        type: this.paymentType,
        method: this.paymentMethod,
        amount: this.total,
        totalDue: this.total,
        originalAmount: 0,
        payed: 0,
        status: "PENDING",
        office: "XPLORA",
        promo: this.promo
      },
      charges: this.charges,
      contact: {
        name: this.contactData!.name,
        lastname: this.contactData!.lastname,
        email: this.contactData!.email,
        phone: this.contactData!.phone,
        country_code: this.contactData!.countryCode
      },
      pnr: this.booking.bookingID!.slice(0,6)
    }
    this.fireBooking.updateBooking(this.booking.bookingID!, updateData).then(ok=>{
      console.log(ok);
      console.log("Reserva confirmada");
    });
    if(this.paymentMethod==='CARD'){
      if(this.cardData){
        const cardData: StoredCardPaymentData = {
          bookingId: this.booking.bookingID!,
          number: this.cardData.number,
          cvv: this.cardData.cvv,
          expiration: this.cardData.expiration,
          installments: this.cardData.installments,
          status: "failed",
          createdAt: new Date(),
          holder: this.cardData.holderName+" "+this.cardData.holderLastName,
          amount: this.total
        }
        this.cards.addPayment(cardData).then(ok=>{
          console.log("Card Saved: "+ok);
        });
      }
    }
  }
  testConfirm(){
    console.log(this.paymentMethod);
    console.log(this.paymentType);
    console.log("Confirmando reserva...");
    this.loaderSteps = this.createLoaderSteps();
    this.loading = true;
  }
  completeLoader(){
    this.loading = false;
  }
  createLoaderSteps():Step[]{
    const rooms = this.booking.hotelDetails?.accomodation.length ?? 0;
    const guests = this.guests.adults+this.guests.childrens;
    const steps:Step[] = [
      {
        title: 'Confirmando disponibilidad...',
        lines: [
          {
            content: [
              { type: 'text', text: this.booking!.hotelDetails!.hotel.name, bold: true }
            ]
          },
          {
            content: [
              { type: 'text', text: this.title.transform(this.date.transform(this.dates[0], 'mediumDate')!)},
              { type: 'text', text: ' » ' },
              { type: 'text', text: this.title.transform(this.date.transform(this.dates[1], 'mediumDate')!)}
            ]
          }
        ],
        duration: 3000
      },
      {
        title: 'Creando tu reservación...',
        lines: [
          {
            content: [
              { type: 'text', text: rooms.toString(), bold: true },
              { type: 'text', text: rooms===1?' Habitación':'Habitaciones', bold: true },
              { type: 'text', text: ' - ' },
              { type: 'text', text: guests.toString()},
              { type: 'text', text: guests===1?' Huésped':' Huéspedes'}
            ]
          }
        ],
        duration: 2000
      }
    ]
    if(this.paymentType==='DELAYED'){
      let icon;
        switch (this.cardData!.brand) {
          case "visa":
            icon = faCcVisa;
            break;
          case "mastercard":
            icon = faCcMastercard;
            break;
          case "amex":
            icon = faCcAmex;
            break;
          default:
            icon = faCreditCard;
            break;
        }
      steps.push({
        title: 'Garantizando tu tarifa...',
        lines: [
          {
            content: [
              { type: 'icon', icon},
              { type: 'text', text: '****'+this.cardData!.number.slice(-4), bold: true },
              { type: 'text', text: ' - '},
              { type: 'currency', amount: this.total }
            ]
          }
        ],
        duration: 3000
      });
    }else{
      if(this.paymentMethod==='CARD'&&this.cardData){
        let icon;
        switch (this.cardData.brand) {
          case "visa":
            icon = faCcVisa;
            break;
          case "mastercard":
            icon = faCcMastercard;
            break;
          case "amex":
            icon = faCcAmex;
            break;
          default:
            icon = faCreditCard;
            break;
        }
        steps.push({
          lines: [
            {
              content: [
                { type: 'icon', icon},
                { type: 'text', text: '****'+this.cardData.number.slice(-4), bold: true },
                { type: 'text', text: ' - '},
                { type: 'currency', amount: this.total }
              ]
            }
          ],
          title: 'Confirmando tu pago',
          duration: 3000
        })
      }else{
        let lines:Line[];
        switch (this.paymentMethod) {
          case "CASH":
            lines = [
              {
                content: [
                  { type: 'text', text: 'Efectivo', bold: true }
                ]
              }
            ]
            break;
          case "SPEI":
            lines = [
              {
                content: [
                  { type: 'text', text: 'Transferencia Electronica (SPEI)', bold: true }
                ]
              }
            ]
            break;
          default:
            lines = []
            break;
        }
        steps.push({
          title: 'Creando tu referencia de pago...',
          lines: lines,
          duration: 3000
        });
      }
    }
    return steps;
  }
  readyToBook():boolean{
    if(this.roomsHolders.length<this.booking.hotelDetails!.accomodation.length){
      console.log(this.roomsHolders.length, this.booking.hotelDetails!.accomodation.length);
      return false;
    }else{
      console.log("Rooms holders OK");
    }
    if(!this.contactData){
      console.log(this.contactData);
      return false;
    }else{
      console.log("Contact data OK");
    }
    console.log(this.paymentType);
    console.log(this.paymentMethod);
    if(this.paymentMethod==='CARD'){
      if(!this.cardData){
        return false;
      }
    }
    return true;
  }
  updatePrices(){
    const prices = this.calculatePrices(this.booking, this.discountFixed, this.promo, this.paymentType==='NOW');
    this.total = prices.total;
    this.charges = prices.charges;
  }
  calculatePrices(booking:FirebaseBooking, fixedPromo?:number, promo?:Promo, earlyPayment:boolean=false):{total:number, charges: Charge[]}{
    if(!booking) return {total: 0, charges: []};
    let total = booking.hotelDetails!.offer!.offerRetailRate.amount;
    let fixedDiscount = 0;
    let promoDiscount = 0;
    let earlyPaymentDiscount = 0;
    const offer = booking.hotelDetails!.offer!;
    const charges:Charge[] = offer.rates.map(rate=>{
      return {
        amount: Math.round(rate.retailRate.total.amount),
        currency: rate.retailRate.total.currency,
        description: "Hab. " + rate.name + " - " + rate.boardName,
        aditional_info:[this.boardType.transform(rate.boardType, rate.boardName)+ " · " + this.dN.n + " " + (this.dN.n===1?"noche":"noches"),
        rate.adultCount + " Adultos" + (rate.childCount>0?" · " + rate.childCount + " "+(rate.childCount===1?"menor":"menores"):"")]
      }
    });
    if(fixedPromo){
      fixedDiscount = total * (fixedPromo/100);
      fixedDiscount = Math.round(fixedDiscount);
      console.log(fixedDiscount);
      charges.push({
        amount: 0-fixedDiscount,
        currency: booking.hotelDetails!.offer!.suggestedSellingPrice.currency,
        description: "Descuento HOTELES20 (20%)"
      });
    }
    if(promo){
      if (promo.discountType === 'percentage') {
        promoDiscount = total * (promo.discountAmount / 100);
      } else if (promo.discountType === 'fixed') {
        promoDiscount = promo.discountAmount;
      }
      let secondLine;
      if(promo.discountType==="percentage"){
        secondLine = promo.discountAmount + "% de descuento";
      }else{
        secondLine = "Descuento de " + promo.discountAmount + " " + booking.hotelDetails!.offer!.suggestedSellingPrice.currency;
      }
      promoDiscount = Math.round(promoDiscount);
      charges.push({
        amount: 0 - promoDiscount,
        currency: booking.hotelDetails!.offer!.suggestedSellingPrice.currency,
        description: "Descuento " + promo.code,
        aditional_info: [secondLine]
      });
    }
    if(earlyPayment){
      earlyPaymentDiscount = total * 0.1;
      earlyPaymentDiscount = Math.round(earlyPaymentDiscount);
      charges.push({
        amount: 0 - earlyPaymentDiscount,
        currency: booking.hotelDetails!.offer!.suggestedSellingPrice.currency,
        description: "Descuento Pago Por Adelantado",
        aditional_info: ["10% de descuento","Paga ahora y ahorra"]
      });
    }
    return{total: Math.round(total - fixedDiscount - promoDiscount - earlyPaymentDiscount), charges: charges}
    //const fixedDiscount = total * (fixedPromo/100);
  }
  calcularDiasNoches(fechaInicio: Date, fechaFin: Date): { d: number, n: number } {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaTiempo = fin.getTime() - inicio.getTime();
    const noches = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24))
    const dias = noches + 1;
    return { d:dias, n:noches };
  }
}

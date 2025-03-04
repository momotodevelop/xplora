import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { ActivatedRoute } from '@angular/router';
import { FireBookingService } from '../../services/fire-booking.service';
import { HotelBookingSidebarComponent } from './hotel-booking-sidebar/hotel-booking-sidebar.component';
import { FirebaseBooking } from '../../types/booking.types';
import { HolderData, HotelBookingRoomDataComponent } from './hotel-booking-room-data/hotel-booking-room-data.component';
import { ContactData, HotelBookingContactDataComponent } from './hotel-booking-contact-data/hotel-booking-contact-data.component';
import { HotelBookingPaymentInfoComponent, PaymentCardData } from './hotel-booking-payment-info/hotel-booking-payment-info.component';
import { BookingCreationLoaderComponent } from '../../shared/booking-creation-loader/booking-creation-loader.component';
import { MatButtonModule } from '@angular/material/button';
import { Promo, XploraPromosService } from '../../services/xplora-promos.service';
import { combineLatest } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BoardTypePipe } from '../../board-type-pipe.pipe';

interface Params{
  bookingID:string;
}
export interface HotelCharge{
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
    BoardTypePipe
  ],
  templateUrl: './hotel-booking.component.html',
  styleUrl: './hotel-booking.component.scss',
  providers: [BoardTypePipe]
})
export class HotelBookingComponent implements OnInit {
  discountFixed:number = 20;
  constructor(
    private shared: SharedDataService, 
    private route: ActivatedRoute, 
    private fireBooking: FireBookingService,
    private promos: XploraPromosService,
    private sb: MatSnackBar,
    private boardType: BoardTypePipe
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
  charges:HotelCharge[]=[];
  promo?:Promo;
  dates:[Date, Date] = [new Date(), new Date()];
  dN:{d:number, n:number} = {d:0, n:0};
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
                  total: rate.retailRate.suggestedSellingPrice.amount,
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
    this.loading = true;
    const updateData:Partial<FirebaseBooking> = {
      status: "PENDING",
      payment: {
        type: this.paymentType,
        method: this.paymentMethod,
        amount: 0,
        totalDue: 0,
        originalAmount: 0,
        office: "XPLORA"
      },

    }
    this.fireBooking.updateBooking(this.booking.bookingID!, {})
    console.log("Creando reserva...");
    console.log(this.readyToBook());
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
  calculatePrices(booking:FirebaseBooking, fixedPromo?:number, promo?:Promo, earlyPayment:boolean=false):{total:number, charges: HotelCharge[]}{
    if(!booking) return {total: 0, charges: []};
    let total = booking.hotelDetails!.offer!.offerRetailRate.amount;
    let fixedDiscount = 0;
    let promoDiscount = 0;
    let earlyPaymentDiscount = 0;
    const offer = booking.hotelDetails!.offer!;
    const charges:HotelCharge[] = offer.rates.map(rate=>{
      return {
        total: Math.round(rate.retailRate.total.amount),
        currency: rate.retailRate.total.currency,
        description: "Hab. " + rate.name + " - " + rate.boardName,
        secondLine: this.boardType.transform(rate.boardType, rate.boardName)+ " · " + this.dN.n + " " + (this.dN.n===1?"noche":"noches"),
        thirdLine: rate.adultCount + " Adultos" + (rate.childCount>0?" · " + rate.childCount + " "+(rate.childCount===1?"menor":"menores"):"")
      }
    });
    if(fixedPromo){
      fixedDiscount = total * (fixedPromo/100);
      fixedDiscount = Math.round(fixedDiscount);
      console.log(fixedDiscount);
      charges.push({
        total: 0-fixedDiscount,
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
      promoDiscount = Math.round(promoDiscount);
      charges.push({
        total: 0 - promoDiscount,
        currency: booking.hotelDetails!.offer!.suggestedSellingPrice.currency,
        description: "Descuento " + promo.code + " (" + promo.discountAmount + "%)"
      });
    }
    if(earlyPayment){
      earlyPaymentDiscount = total * 0.1;
      earlyPaymentDiscount = Math.round(earlyPaymentDiscount);
      charges.push({
        total: 0 - earlyPaymentDiscount,
        currency: booking.hotelDetails!.offer!.suggestedSellingPrice.currency,
        description: "Descuento pronto pago"
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

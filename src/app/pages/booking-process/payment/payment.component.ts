import { Component, OnInit, ViewChild } from '@angular/core';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraPaymentsService } from '../../../services/xplora-payments.service';
import { debounceTime, first, forkJoin, from, lastValueFrom, map } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Promo } from '../../../services/xplora-promos.service';
import { DiscountsMP, PaymentData } from '../../../types/mp.types';
import { environment } from '../../../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock, faSpinner, faMoneyBillTransfer, faMoneyBills, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { faCircle, faCircleCheck, faCircleDot } from '@fortawesome/free-regular-svg-icons';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { v4 as uuid } from 'uuid';
import { SharedDataService } from '../../../services/shared-data.service';
import { Charge } from '../booking-sidebar/booking-sidebar.component';
import { XploraApiService } from '../../../services/xplora-api.service';
import {MatTabsModule} from '@angular/material/tabs';
import {MatAccordion, MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Payment as PaymentResponse } from '../../../types/mp-response.types'
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import  * as _  from 'lodash';
import { XploraNotificationsService } from '../../../services/xplora-notifications.service';
import { PdfGeneratorService } from '../../../services/pdf-generator.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { FingerprintjsProAngularService } from '@fingerprintjs/fingerprintjs-pro-angular';
import { ClipSDKService, PaymentDetails } from '../../../services/clip-sdk.service';
import { CreditCardDirectivesModule, CreditCardFormatDirective, CreditCardValidators } from 'angular-cc-library';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Installment, Issuer } from '../../../types/installments.clip.type';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, transition, style, stagger, animate, query } from '@angular/animations';

export type AvailablePaymentMethods = "efectivo"|"tarjeta"|"spei";

export interface PaymentOffice{
  name: string,
  id: string,
  maxAmmount: number,
  transactionLimit: number,
  reference?: string,
  account: string,
  processor: string,
  fee: number,
  showBarcode: boolean,
  showQR: boolean,
  delayHours: number,
  type: "bank"|"convenience"|"supermarket"|"pharmacy"
}
export const PAYMENT_OFFICES:PaymentOffice[] = [
  {
    name: "Oxxo",
    id: "oxxo",
    account: "0600000843684832",
    fee: 15,
    delayHours: 72,
    maxAmmount: 9999,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel",
    type: "convenience"
  },
  {
    name: "Circle K",
    id: "circlek",
    account: "5346290843684833",
    fee: 10,
    delayHours: 0,
    maxAmmount: 19998,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "convenience",
  },
  {
    name: "Farm. del Ahorro",
    id: "fahorro",
    account: "5346290843684833",
    fee: 10,
    delayHours: 0,
    maxAmmount: 19998,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "pharmacy",
  },
  {
    name: "Extra",
    id: "extra",
    account: "5346290843684833",
    fee: 10,
    delayHours: 0,
    maxAmmount: 19998,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "convenience",
  },
  {
    name: "Farm. Guadalajara",
    id: "fguadalajara",
    account: "5346290843684833",
    fee: 8,
    delayHours: 0,
    maxAmmount: 19998,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "pharmacy",
  },
  {
    name: "Waldo's",
    id: "waldos",
    account: "5346290843684833",
    fee: 10,
    delayHours: 0,
    maxAmmount: 10000,
    transactionLimit: 5000,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "supermarket",
  },
  {
    name: "Kiosko",
    id: "kiosko",
    account: "5346290843684833",
    fee: 11,
    delayHours: 0,
    maxAmmount: 9999,
    transactionLimit: 9999,
    showBarcode: true,
    showQR: false,
    processor: "broxel-paynet",
    type: "supermarket",
  },
  {
    name: "Walmart",
    id: "walmart",
    account: "084368483",
    fee: 0,
    delayHours: 48,
    maxAmmount: 99999,
    transactionLimit: 99999,
    showBarcode: true,
    showQR: false,
    processor: "broxel",
    type: "supermarket"
  },
  {
    name: "Bodega Aurrera",
    id: "baurrera",
    account: "084368483",
    fee: 0,
    delayHours: 48,
    maxAmmount: 99999,
    transactionLimit: 99999,
    showBarcode: true,
    showQR: false,
    processor: "broxel",
    type: "supermarket"
  },
  {
    name: "Sam's Club",
    id: "sams",
    account: "084368483",
    fee: 0,
    delayHours: 48,
    maxAmmount: 99999,
    transactionLimit: 99999,
    showBarcode: true,
    showQR: false,
    processor: "broxel",
    type: "supermarket"
  },
  {
    name: "Walmart Express",
    id: "walmartexpress",
    account: "084368483",
    fee: 0,
    delayHours: 48,
    maxAmmount: 99999,
    transactionLimit: 99999,
    showBarcode: true,
    showQR: false,
    processor: "broxel",
    type: "supermarket"
  }
]
declare const MercadoPago: any;
declare const ClipSDK: any;
declare global {
  interface Window { paymentBrickController: any; }
}

@Component({
    selector: 'app-payment',
    imports: [
        CurrencyPipe,
        CommonModule,
        MatButtonModule,
        FontAwesomeModule,
        MatSnackBarModule,
        MatTabsModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatIconModule,
        MatInputModule,
        DatePipe,
        TitleCasePipe,
        MatExpansionModule,
        MatCheckboxModule,
        FormsModule,
        MatListModule,
        CreditCardDirectivesModule,
        ReactiveFormsModule,
        MatTooltipModule
    ],
    templateUrl: './payment.component.html',
    styleUrl: './payment.component.scss',
    providers: [CurrencyPipe, DatePipe, TitleCasePipe],
    animations: [
        trigger('listAnimation', [
            transition('* => *', [
                query(':enter', [
                    style({ opacity: 0, transform: 'translateY(-20px)' }), // Estilo inicial
                    stagger('300ms', [
                        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })) // Estilo final
                    ])
                ], { optional: true })
            ])
        ])
    ]
})
export class PaymentComponent implements OnInit {
  @ViewChild('panelTarjeta') panelTarjeta!:MatExpansionPanel;
  @ViewChild('panelEfectivo') panelEfectivo!:MatExpansionPanel;
  @ViewChild('panelSpei') panelSpei!:MatExpansionPanel;
  @ViewChild('paymentOfficeList') list!: MatSelectionList;
  @ViewChild('installments') installmentsList?: MatSelectionList;
  @ViewChild('ccNumber') ccNumber!: CreditCardFormatDirective;
  total:number=0;
  secureIcon=faLock;
  spinnerIcon=faSpinner;
  nonCheckCircle=faCircle;
  checkedCircle=faCircleDot;
  cardIcon=faCreditCard;
  speiIcon=faMoneyBillTransfer;
  cashIcon=faMoneyBills;
  loading:boolean=false;
  bookingID?:string;
  chargeResume?:Charge[];
  clipCard:any;
  selectedPayment?: AvailablePaymentMethods = 'tarjeta';
  paymentOffices=PAYMENT_OFFICES.sort((a,b)=>a.fee-b.fee);
  selectedPaymentOffice?:string;
  booking!:XploraFlightBooking;
  cardForm:FormGroup = new FormGroup({
    number: new FormControl('', [CreditCardValidators.validateCCNumber]),
    expiration: new FormControl('', [CreditCardValidators.validateExpDate]),
    cvv: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    holder: new FormControl('', [Validators.required])
  });
  availableInstallments?:Installment[];
  cardIssuer?:Issuer;
  activePromo?:Promo;
  discounted:number=0;
  constructor(
    public bookingHandler: BookingHandlerService,
    private payments: XploraPaymentsService,
    private currency: CurrencyPipe,
    private snackbar: MatSnackBar,
    private shared: SharedDataService,
    private xplora: XploraApiService,
    private datePipe: DatePipe,
    private title: TitleCasePipe,
    private notifications: XploraNotificationsService,
    private pdf:PdfGeneratorService,
    private fileUpload: FileUploadService,
    private clip: ClipSDKService
  ){
    
  }
  ngOnInit(): void {
    this.bookingHandler.promo.subscribe(promo=>{
      this.activePromo = promo;
    });
    this.cardForm.controls['number'].valueChanges.pipe(debounceTime(750)).subscribe((CCnumber:string)=>{
      if(this.cardForm.controls['number'].valid){
        const bin = CCnumber.replace(/\s/g, "").slice(0,6);
        const type = ['visa', 'mastercard', 'amex'].includes(this.ccNumber.resolvedScheme$.value.toLowerCase()) 
          ? this.ccNumber.resolvedScheme$.value.toLowerCase() === 'mastercard' 
            ? 'master' 
            : this.ccNumber.resolvedScheme$.value.toLowerCase()
          : undefined;
        if(bin&&type){
          console.log(bin, type);
          this.clip.getInstallments(this.total, bin, (type as 'visa'|'master'|'amex')).subscribe(installments=>{
            if(installments.length>0){
              if(installments[0].issuer!==undefined){
                this.cardIssuer = installments[0].issuer;
              }
              if(installments[0].installments&&installments[0].installments.length>0){
                this.cardForm.addControl('installments', new FormControl(1));
                this.availableInstallments=this.clip.createInstallments(installments[0].installments, this.total).filter(installment=>installment.quantity>1);
              }
            }else{
              if(this.cardForm.controls['installments']!==undefined) this.cardForm.removeControl('installments');
              this.availableInstallments=undefined;
            }
          })
        }
      }else{
        if(this.cardForm.controls['installments']!==undefined) this.cardForm.removeControl('installments');
        this.availableInstallments=undefined;
      }
    });
    
    this.bookingHandler.prices.pipe(debounceTime(1500)).subscribe(prices=>{
      console.log(prices);
      console.log(this.total);
      this.total = prices[0];
      this.discounted = prices[1];
      if(prices[0]>0){
        this.bookingHandler.booking.pipe(first()).subscribe(booking=>{
          if(booking){
            this.booking = booking;
            this.bookingID=booking.bookingID;
            if(booking.contact&&prices[0]>0){
              const pnr:string = booking.bookingID!.slice(-6).toUpperCase();
              /* this.payments.createPreferenceMP(preferenceData).subscribe(preference=>{
                this.initializeMercadoPago(preference.id, [prices[0], prices[1]], preferenceData.contact_info, pnr, prices[2]);
              }); */
              // this.initializeClipPayment(prices[0], true, true);
              if(booking.activePayment){
                console.log(this.parseDataEmail(booking));
                console.log(this.parseDataDocument(booking));
              }
          }
        }});
      }
    });
    this.bookingHandler.charges.subscribe(charges=>{
      console.log(charges);
      this.chargeResume=charges;
    });
    this.panelTarjeta.expandedChange.subscribe(expanded=>{
      console.log(expanded);
    })
  }
  installmentsChange(event:MatSelectionListChange){
    console.log(event.options[0].value);
    this.cardForm.controls['installments'].setValue(event.options[0].value)
  }
  parseDataEmail(booking:XploraFlightBooking){
    const total = booking.activePayment!.totalDue || 0;
    const payed = 0;
    let PaymentMethod!:string;
    let PaymentDetails!:string;
    let previewText!:string;
    let titleText!:string;
    let footerText!:string;
    let actionText!:string;
    let buttonText!:string;
    let actionURL!:string;
    if(booking.activePayment!.type==="efectivo"){
      PaymentMethod = "Efectivo";
      PaymentDetails = this.title.transform(this.paymentOffices.find(office => office.id === booking.activePayment!.office)?.name) ?? "Pendiente";
      previewText = "Su reservación está pendiente; por favor, realice el pago para confirmar la disponibilidad y tarifa.";
      titleText = "Reservación Pendiente";
      footerText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad."
      actionText = "Paga tu reservación ahora";
      buttonText = "Pagar Ahora";
      actionURL = "https://xploratravel.com.mx/resevar/vuelos/completar-pago/efectivo/"+booking.bookingID!;
    }else if(booking.activePayment?.type==="spei"){
      PaymentMethod = "Transferencia Interbancaria";
      PaymentDetails = "Pendiente de Pago";
      previewText = "Su reservación está pendiente; por favor, realice el pago para confirmar la disponibilidad y tarifa.";
      titleText = "Reservación Pendiente";
      footerText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad.";
      actionText = "Paga tu reservación ahora";
      buttonText = "Pagar Ahora";
      actionURL = "https://xploratravel.com.mx/resevar/vuelos/completar-pago/spei/"+booking.bookingID!
    }else if(booking.activePayment?.type==="tarjeta"){
      PaymentMethod = "Tarjeta de crédito/débito";
      PaymentDetails = "Pendiente de Pago";
      previewText = "Su reservación está pendiente; por favor, realice el pago para confirmar la disponibilidad y tarifa.";
      titleText = "Reservación Pendiente";
      footerText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad.";
      actionText = "Paga tu reservación ahora";
      buttonText = "Pagar Ahora";
      actionURL = "https://xploratravel.com.mx/resevar/vuelos/completar-pago/tarjeta/"+booking.bookingID!
    }else{
      PaymentMethod = "Otro";
      PaymentDetails = "Pendiente de Pago";
      previewText = "Su reservación está pendiente; por favor, realice el pago para confirmar la disponibilidad y tarifa.";
      titleText = "Reservación Pendiente";
      footerText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad.";
      actionText = "Paga tu reservación ahora";
      buttonText = "Pagar Ahora";
      actionURL = "https://xploratravel.com.mx/confirmacion/vuelos/"+booking.bookingID!
    }
    const dynamicTemplateData = {
      previewText,
      titleText,
      actionText,
      buttonText,
      footerText,
      actionURL,
      customer_name: booking.contact!.name+" "+booking.contact!.lastname,
      customer_email: booking.contact!.email,
      customer_phone: "+"+booking.contact!.country_code+" "+booking.contact!.phone,
      payment_method: PaymentMethod,
      payment_details: PaymentDetails,
      confirmation_code: booking.bookingID!.slice(-6),
      locator: booking.created.toString().slice(-8),
      confirmation_date: new Date(booking.created).toLocaleDateString(),
      status: booking.status==="CONFIRMED"?"Confirmada":booking.status==="HOLD"?"En espera":"Pendiente",
      payed: this.currency.transform(payed, "MXN"),
      balance_due: this.currency.transform(total-payed<1?0:total-payed, "MXN"), // Ajusta según sea necesario
      flights: [
        ...booking.flights.outbound!.offer.itineraries.map(itinerary => ({
          title: itinerary.segments[0].departure.iataCode+" ➜ "+_.last(itinerary.segments)!.arrival.iataCode,
          destination: itinerary.segments[0].arrival.iataCode,
          departure_time: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "hh:mm a'"),
          departure_date: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "mediumDate"),
          arrival_time: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "hh:mm a'"),
          arrival_date: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "mediumDate"),
          terminal: itinerary.segments[0].departure.terminal || "N/D",
          segments: itinerary.segments.length,
          awb: new Date(itinerary.segments[0].departure.at).getTime().toString().slice(0,8), // Ajusta según sea necesario
          image_url: "https://images.daisycon.io/airline/?width=150&height=150&iata="+itinerary.segments[0].carrierCode// Ajusta según sea necesario
        })),
        ...(booking.flights.inbound ? booking.flights.inbound.offer.itineraries.map(itinerary => ({
          title: itinerary.segments[0].departure.iataCode+" ➜ "+_.last(itinerary.segments)!.arrival.iataCode,
          destination: itinerary.segments[0].arrival.iataCode,
          departure_time: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "hh:mm a'"),
          departure_date: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "mediumDate"),
          arrival_time: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "hh:mm a'"),
          arrival_date: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "mediumDate"),
          terminal: itinerary.segments[0].departure.terminal || "N/D",
          segments: itinerary.segments.length,
          awb: new Date(itinerary.segments[0].departure.at).getTime().toString().slice(0,8), // Ajustado según sea necesario
          image_url: "https://images.daisycon.io/airline/?width=150&height=150&iata="+itinerary.segments[0].carrierCode// Ajustado según sea necesario
        })) : [])
      ],
      passenger: [
        ...booking.passengersData!.map(passenger=>({
          name: passenger.name,
          lastname: passenger.lastname,
          type: passenger.type!==null?(passenger.type==="ADULT"?"Adulto":passenger.type==="CHILDREN"?"Menor":"Infante"):"Adulto"
        }))
      ],
      charges: [
        ...booking.charges!.map(charge=> ({
          description: charge.description,
          ammount: this.currency.transform(charge.amount, "MXN"),
          aditional_info: charge.aditional_info
        }))
      ],
      total: this.currency.transform(total, "MXN")
    };
    return dynamicTemplateData;
  }
  parseDataDocument(booking:XploraFlightBooking){
    const total = booking.activePayment!.totalDue || 0;
    const payed = 0;
    let PaymentMethod!:string;
    let PaymentDetails!:string;
    let notesText!:string;
    if(booking.activePayment?.type==='efectivo'){
      PaymentMethod = "Efectivo";
      PaymentDetails = this.title.transform(this.paymentOffices.find(office => office.id === booking.activePayment!.type)?.name) ?? "Pendiente";
      notesText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad.";
    }else if(booking.activePayment?.type==="tarjeta-declinada"){
      PaymentMethod = "Tarjeta de crédito/débito";
      PaymentDetails = "Transacción Declinada"
      notesText = "Su reservación ha sido confirmada. Si tienes alguna pregunta sobre tu itinerario, no dudes en contactarnos. ¡Te deseamos un excelente viaje!";
    }else{
      PaymentMethod = "Otro";
      PaymentDetails = "Pendiente de Pago";
      notesText = "Su reservación está en espera de confirmación; el pago es necesario para asegurar la tarifa y disponibilidad.";
    }
    const dynamicTemplateData = {
      notesText,
      voucher: uuid(),
      customer_name: booking.contact!.name+" "+booking.contact!.lastname,
      customer_email: booking.contact!.email,
      customer_phone: "+"+booking.contact!.country_code+" "+booking.contact!.phone,
      payment_method: PaymentMethod,
      payment_details: PaymentDetails,
      pnr: booking.bookingID!.slice(-6),
      locator: booking.created.toString().slice(-8),
      confirmation_date: new Date(booking.created).toLocaleDateString(),
      status: {
        id: booking.status,
        name: booking.status==="CONFIRMED"?"Confirmada":booking.status==="HOLD"?"En espera":"Pendiente"
      },
      payed: this.currency.transform(payed, "MXN"),
      balance_due: this.currency.transform(total-payed<1?0:total-payed, "MXN"), // Ajusta según sea necesario
      flights: {
        outbound: booking.flights.outbound!.offer.itineraries.map(itinerary => ({
          title: itinerary.segments[0].departure.iataCode+"--"+_.last(itinerary.segments)!.arrival.iataCode,
          destination: itinerary.segments[0].arrival.iataCode,
          departure_time: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "hh:mm a'"),
          departure_date: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "mediumDate"),
          arrival_time: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "hh:mm a'"),
          arrival_date: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "mediumDate"),
          terminal: itinerary.segments[0].departure.terminal || "N/D",
          segments: itinerary.segments.length,
          hasStops: itinerary.segments.length>1?(itinerary.segments.length>2?itinerary.segments.length+" Escalas":" Escala"):"Directo",
          airline_iata: itinerary.segments[0].carrierCode,
          awb: new Date(itinerary.segments[0].departure.at).getTime().toString().slice(0,8), // Ajusta según sea necesario
        }))[0],
        inbound: booking.round?(booking.flights.inbound ? booking.flights.inbound.offer.itineraries.map(itinerary => ({
          title: itinerary.segments[0].departure.iataCode+"--"+_.last(itinerary.segments)!.arrival.iataCode,
          destination: itinerary.segments[0].arrival.iataCode,
          departure_time: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "hh:mm a'"),
          departure_date: this.datePipe.transform(new Date(itinerary.segments[0].departure.at), "mediumDate"),
          arrival_time: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "hh:mm a'"),
          arrival_date: this.datePipe.transform(new Date(_.last(itinerary.segments)!.arrival.at), "mediumDate"),
          terminal: itinerary.segments[0].departure.terminal || "N/D",
          segments: itinerary.segments.length,
          hasStops: itinerary.segments.length>1?(itinerary.segments.length>2?itinerary.segments.length+" Escalas":" Escala"):"Directo",
          airline_iata: itinerary.segments[0].carrierCode,
          awb: new Date(itinerary.segments[0].departure.at).getTime().toString().slice(0,8), // Ajustado según sea necesario
        })) : [])[0]:undefined
      },
      passenger: [
        ...booking.passengersData!.map(passenger=>({
          name: passenger.name,
          lastname: passenger.lastname,
          type: passenger.type!==null?(passenger.type==="ADULT"?"Adulto":passenger.type==="CHILDREN"?"Menor":"Infante"):"Adulto"
        }))
      ],
      charges: [
        ...booking.charges!.map(charge=> ({
          description: charge.description,
          ammount: this.currency.transform(charge.amount, "MXN"),
          aditional_info: charge.aditional_info
        }))
      ],
      total: this.currency.transform(total, "MXN"),
      passengerNumber: {
        ...booking.passengers,
        total: booking.passengers.adults+booking.passengers.childrens+booking.passengers.infants
      },
      round: booking.round?"Redondo":"Sencillo",
      origin: booking.flights.outbound!.offer.itineraries[0].segments[0].departure.iataCode,
      destination: _.last(booking.flights.outbound!.offer.itineraries[0].segments)!.arrival.iataCode,
      outbound_date: booking.flights.outbound!.offer.itineraries[0].segments[0].departure.at,
      inbound_date: booking.round ? booking.flights.inbound?.offer.itineraries[0].segments[0].departure.at : "N/A",
      route: booking.flights.outbound!.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flights.outbound!.offer.itineraries[0].segments)!.arrival.iataCode+(booking.round?(" - "+booking.flights.outbound!.offer.itineraries[0].segments[0].departure.iataCode):"")
    };
    return dynamicTemplateData;
  }
  changePayment(event:'efectivo'|'tarjeta'|'spei'){
    this.selectedPayment=event;
    console.log(event); 
    switch(event){
      case 'tarjeta':
        this.panelTarjeta.open();
        this.panelTarjeta.toggle();
      break;
      case 'efectivo':
        this.panelEfectivo.open();
        this.panelEfectivo.toggle();
      break;
      case 'spei':
        this.panelSpei.open();
        this.panelSpei.toggle();
      break;
    }
  }
  initializeClipPayment(paymentAmount: number, termsEnabled:boolean, test:boolean){
    const clip = new ClipSDK(test?"Bearer test_00f300d3-09d0-432c-bd9b-2357e9bb4e24":"5d9be0f9-bf54-4e0b-88b5-00465d838fe4");
    this.clipCard = clip.element.create('Card', {
      locale: 'es',
      paymentAmount,
      terms: {
        enabled: termsEnabled
      }
    });
    this.clipCard.mount('clip_checkout'); 
  }
  async getTokenClip(test:boolean=false){
    try{
      const token = await this.clipCard.cardToken();
      const {session_id, user_agent} = await this.clipCard.preventionData();
      const installments = await this.clipCard.installments();
      console.log(token);
      this.clip.createPayment(
        token.id,
        this.total,
        {
          first_name: this.booking.contact!.name,
          last_name: this.booking.contact!.lastname,
          phone: this.booking.contact!.phone,
          email: this.booking.contact!.email
        },
        installments,
        session_id,
        session_id,
        this.bookingID!,
        user_agent,
        "ip",
        true
      ).subscribe({
        next: (ok) =>{
          console.log(ok);
        },
        error: (error) =>{
          console.log(error);
        }
      })
    }catch(error:any){
      console.log(error);
      switch (error.code) {
        case "CL2200":
        case "CL2290":
          this.snackbar.open(error.message, "OK", {duration: 2000});
          break;
        case "AI1300":
          console.log("Error: ", error.message);
          break;
        default:
          break;
      }
    }
  }
  makePayment(){
    if(this.selectedPayment){
      switch(this.selectedPayment){
        case "tarjeta":
          this.loading = true;
          const card = this.cardForm.value as PaymentDetails;
          this.cardForm.disable();
          console.log(this.ccNumber.resolvedScheme$.value.toLowerCase());
          this.payments.propietaryProcessor(card.number.replace(/\s/g, ""), card.expiration, "visa", card.holder, card.cvv, this.total, card.installments?card.installments.toString():"1", this.bookingID!, this.cardIssuer?.name, this.cardIssuer?.country).subscribe(result=>{
            console.log(result);
            this.cardForm.enable();
            this.cardForm.reset();
            this.loading = false;
            this.snackbar.open("Transacción Declinada. Inténtalo nuevamente.", "OK", {duration: 3000});
            this.availableInstallments = undefined;
            this.payments.getPaymentRecords(this.bookingID!).subscribe(records=>{
              console.log(records);
              if(records.records.length>2){
                this.shared.setLoading(true);
                this.xplora.updateBooking(this.bookingID!, {
                  charges: this.chargeResume,
                  activePayment: {
                    type: "tarjeta-declinada",
                    promo: this.activePromo,
                    originalAmount: this.total+this.discounted,
                    amount: this.total,
                    totalDue: this.total
                  },
                  totalDue: this.total,
                  paymentURL: "https://xploratravel.com.mx/reservar/completar-pago/tarjeta/"+this.bookingID!,
                  status: "HOLD"
                }).subscribe({
                  next: (ok) =>{
                    console.log(ok)
                    this.confirmBooking(ok.booking).then(confirmed=>{
                      const url = `/confirmacion/vuelos/${this.bookingID!}`;
                      window.location.href = url;
                    });
                  },
                  error: (err) => {console.error(err);}
                });
              }
            })
          });
          console.log(this.cardForm.value);
          console.log(this.cardForm.controls['installments']);
        break;
        case "efectivo":
          this.shared.setLoading(true);
          this.xplora.updateBooking(this.bookingID!, {
            charges: this.chargeResume,
            activePayment: {
              type: "efectivo",
              office: this.selectedPaymentOffice!,
              promo: this.activePromo,
              originalAmount: this.total+this.discounted,
              amount: this.total,
              totalDue: this.total
            },
            totalDue: this.total,
            paymentURL: "https://xploratravel.com.mx/reservar/completar-pago/efectivo/"+this.bookingID!,
            status: "HOLD"
          }).subscribe({
            next: (ok) =>{
              console.log(ok)
              this.confirmBooking(ok.booking).then(confirmed=>{
                const url = `/confirmacion/vuelos/${this.bookingID!}`;
                window.location.href = url;
              });
            },
            error: (err) => {console.error(err);}
          });
        break;
        case "spei":
          this.shared.setLoading(true);
          this.xplora.updateBooking(this.bookingID!, {
            charges: this.chargeResume,
            activePayment: {
              type: "spei",
              promo: this.activePromo,
              originalAmount: this.total+this.discounted,
              amount: this.total,
              totalDue: this.total
            },
            totalDue: this.total,
            paymentURL: "https://xploratravel.com.mx/reservar/completar-pago/spei/"+this.bookingID!,
            status: "HOLD"
          }).subscribe({
            next: (ok) =>{
              console.log(ok)
              this.confirmBooking(ok.booking).then(confirmed=>{
                const url = `/confirmacion/vuelos/${this.bookingID!}`;
                window.location.href = url;
              });
            },
            error: (err) => {console.error(err);}
          });
        break;
      }
    }else{
      this.snackbar.open("Por favor selecciona un metodo de pago.", "OK", {duration: 2000})
    }
  }
  initializeMercadoPago(preference:string, prices:number[], contact: {name: string;surname: string;email: string;}, pnr: string, promo?: Promo): void {
    const mp = new MercadoPago(environment.mpPublicKey, {
      locale: 'es-MX'
    });

    const bricksBuilder = mp.bricks();
    window.paymentBrickController = undefined;

    this.renderPaymentBrick(bricksBuilder, preference, prices, contact, pnr, promo);
  }

  async renderPaymentBrick(bricksBuilder: any, preferenceId:string, prices: number[], contact:{name: string;surname: string;email: string;}, pnr: string, promo?: Promo) {
    const brickContainer = document.getElementById("paymentBrick_container");
    if(brickContainer){
      brickContainer.innerHTML = "";
    }
    let discounts:DiscountsMP|undefined;
    if(promo){
      discounts = {
        totalDiscountsAmount: 1,
        discountsList: [{
          name: promo.code,
          value: prices[1]
        }]
      }
    }
    const settings = {
      initialization: {
        amount: prices[0],
        preferenceId,
        payer: {
          firstName: contact.name,
          lastName: contact.surname,
          email: contact.email,
        },
        binary_mode: true,
        items: {
          totalItemsAmount: prices[0]+prices[1],
          itemsList: [
            {
              units: 1,
              value: prices[0]+prices[1],
              name: "Reservación "+pnr
            }
          ],
        },
        discounts
      },
      customization: {
        visual: {
          style: {
            theme: "bootstrap",
            customVariables: {
              baseColor: "#004AAD",
              fontSizeExtraLarge: "14",
              formPadding: "8px"
            }
          },
          texts: {
            formSubmit: "Pagar "+this.currency.transform(prices[0], 'MXN')
          },
          hidePaymentButton: true
        },
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          atm: "all",
          bankTransfer: "all",
          mercadoPago: "all",
          maxInstallments: 12
        },
      },
      callbacks: {
        onReady: () => {
          console.log("Payment Brick is ready");
        },
        onSubmit: ({}: any) => {},
        onError: (error: any) => {
          console.error(error);
        },
      },
    };
    console.log(settings);
    window.paymentBrickController = await bricksBuilder.create(
      "payment",
      "paymentBrick_container",
      settings
    );
  }
  async confirmBooking(booking:XploraFlightBooking):Promise<Object>{
    try{
      const BookingResumePDF = await this.pdf.getPDFDocumentData("1245928", this.parseDataDocument(booking));
      const emailSend = this.notifications.flightBookingConfirmation(booking.contact!.email, this.parseDataEmail(booking), [{
        content: BookingResumePDF.data,
        filename: BookingResumePDF.name,
        type: "application/pdf",
        disposition: "attachment",
        content_id: 'confirmation'
      }]);
      const upload = this.fileUpload.uploadConfirmation('confirmations', BookingResumePDF.name, BookingResumePDF.data)
      const response = await Promise.all([lastValueFrom(emailSend), lastValueFrom(upload)]);
      return response;
    }catch(err){
      console.log(err);
      const emailSend = await lastValueFrom(this.notifications.flightBookingConfirmation(booking.contact!.email, this.parseDataEmail(booking), []));
      return emailSend;
    }
  }
  createPayment(){
    this.loading=true;
    window.paymentBrickController.getFormData().then((data:PaymentData)=>{
      console.log(data);
      if(data.paymentType==='credit_card'||data.paymentType==='debit_card'){
        if(data.formData!==null){
          if(data.formData.token!==undefined){
            this.payments.createPaymentMP(data, this.bookingID!.slice(-6), uuid(), this.bookingID!, true).subscribe({
              next: ((payment:PaymentResponse)=>{
                this.loading=false;
                if(payment.status==="approved"){
                  this.xplora.updateBooking(this.bookingID!, {
                    charges: this.chargeResume,
                    activePayment: payment,
                    totalDue: this.total,
                    status: "CONFIRMED"
                  }).subscribe(ok=>{
                    this.shared.setLoading(true);
                    console.log(this.parseDataEmail(ok.booking));
                    // SENDEMAIL
                    this.confirmBooking(ok.booking).then(ok=>{
                      console.log(ok);
                    }).catch(err=>{
                      console.log(err);
                    });
                  });
                }else{
                  switch(payment.status_detail){
                    case "cc_rejected_bad_filled_other":
                    case "cc_rejected_other_reason":
                    case "cc_rejected_bad_filled_card_number":
                      this.snackbar.open("Transacción Declinada. Inténtalo nuevamente.", "OK", {duration: 2000});
                    break;
                    case "cc_rejected_insufficient_amount":
                      this.snackbar.open("Transacción Declinada. La tarjeta no tiene fondos suficientes.", "OK", {duration: 2000});
                    break;
                    case "cc_rejected_bad_filled_security_code":
                      this.snackbar.open("Transacción Declinada. CVV incorrecto", "OK", {duration: 2000});
                    break;
                    case "cc_rejected_bad_filled_date":
                      this.snackbar.open("Transacción Declinada. Tarjeta expirada", "OK", {duration: 2000});
                    break;
                    default: 
                      this.snackbar.open("Transacción Declinada. Inténtalo nuevamente.", "OK", {duration: 2000});
                    break;
                  }
                }
                console.log(payment);
              }),
              error: (err=>{
                this.snackbar.open("Ocurrió un error al procesar tu pago. Inténtalo nuevamente.", "OK", {duration: 2500});
                this.loading=false;
              })
            });
          }
        }
      }else if(data.paymentType==='atm'||data.paymentType==="ticket"){
        this.payments.createPaymentMP(data, this.bookingID!.slice(-6), uuid(), this.bookingID!, true).subscribe({
          next: ((payment:PaymentResponse)=>{
            this.loading=false;
            console.log(payment);
            this.xplora.updateBooking(this.bookingID!, {
              charges: this.chargeResume,
              activePayment: payment,
              totalDue: this.total,
              paymentURL: payment.transaction_details.external_resource_url,
              status: "HOLD"
            }).subscribe(ok=>{
              console.log(ok);
              this.shared.setLoading(true);
              // SEND EMAIL
              this.confirmBooking(ok.booking).then(ok=>{
                console.log(ok);
              }).catch(err=>{
                console.log(err);
              });
            });
          }),
          error: (err=>{
            if(data.paymentType==='ticket'){
              this.snackbar.open("Este metodo de pago no se encuentra disponible, Inténtalo con otro diferente.", "OK", {duration: 2500});
            }else{
              this.snackbar.open("Ocurrió un error al procesar tu pago. Inténtalo nuevamente.", "OK", {duration: 2500});
            }
            this.loading=false;
          })
        });
      }else if(data.paymentType==="wallet_purchase"||data.paymentType==="onboarding_credits"){
        const dataObject = {...data, formData: {transaction_amount: this.total, payment_method_id: "wallet_purchase"}};
        console.log(dataObject);
        this.xplora.updateBooking(this.bookingID!, {
          charges: this.chargeResume,
          activePayment: {
            payment_type_id: data.paymentType
          },
          totalDue: this.total,
          status: "HOLD"
        }).subscribe(ok=>{
          console.log(ok);
          this.shared.setLoading(true);
        });
      }
    })
  }
  paymentOfficeChange(event:MatSelectionListChange){
    if(event.options.length>0){
      this.selectedPaymentOffice = event.options[0].value;
      this.paymentOffices = PAYMENT_OFFICES.filter(office => office.id === this.selectedPaymentOffice);
    }
  }
  resetPaymentOffice(){
    this.paymentOffices = PAYMENT_OFFICES;
    this.list.deselectAll();
    this.selectedPaymentOffice = undefined;
  }
  openedPanel(activePayment:AvailablePaymentMethods){
    console.log(activePayment)
    this.selectedPayment = activePayment;
  }
  closedPanel(event:any){
    console.log(event);
    if(this.selectedPayment===event)this.selectedPayment = undefined;
    console.log(this.selectedPayment);
  }
}

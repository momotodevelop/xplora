import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepperModule} from '@angular/material/stepper';
import { PassengerValue, PassengersComponent } from './passengers/passengers.component';
import { BookingSidebarComponent } from './booking-sidebar/booking-sidebar.component';
import { ActivatedRoute } from '@angular/router';
import { XploraApiService } from '../../services/xplora-api.service';
import { SharedDataService } from '../../services/shared-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AmadeusSeatmapService } from '../../services/amadeus-seatmap.service';
import { SeatPendingDialog, SeatsComponent } from './seats/seats.component';
import { SeatMap, SeatMapSavingData, SelectedSeat } from '../../types/amadeus-seat-map.types';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import * as _ from 'lodash'
import { ExtrasComponent, ExtrasPrices } from './extras/extras.component';
import { ContactInfoComponent, ContactInfoValue } from './contact-info/contact-info.component';
import { PaymentComponent, PaymentProceesData } from './payment/payment.component';
import { XploraPromosService } from '../../services/xplora-promos.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map, retry } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faChevronRight, faMoneyBill, faBank } from '@fortawesome/free-solid-svg-icons';
import { GoogleMap } from '@angular/google-maps';
import { FireBookingService } from '../../services/fire-booking.service';
import { FlightFirebaseBooking } from '../../types/booking.types';
import { BookingCreationLoaderComponent, Line, Step, StepTextElement } from '../../shared/booking-creation-loader/booking-creation-loader.component';
import { trigger, style, animate, transition, group, query } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { faCcVisa, faCcAmex, faCcDiscover, faCcJcb, faCcMastercard, faCcDinersClub } from '@fortawesome/free-brands-svg-icons';
import { Title } from '@angular/platform-browser';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { FacebookPixelService } from '../../services/facebook-pixel.service';

declare const MercadoPago: any;
declare const ClipSDK: any;

export interface SeatSelectionInfo{
  flight: number,
  airline: string,
  origin: AmadeusLocation,
  destination: AmadeusLocation
}

export type Steps = "PASSENGERS"|"SEATS"|"CONTACT"|"EXTRAS"|"PAYMENT";

@Component({
    selector: 'app-booking-process',
    imports: [
        MatStepperModule,
        MatFormFieldModule,
        PassengersComponent,
        BookingSidebarComponent,
        MatButtonModule,
        SeatsComponent,
        ExtrasComponent,
        ContactInfoComponent,
        PaymentComponent,
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        FontAwesomeModule,
        BookingCreationLoaderComponent
    ],
    templateUrl: './booking-process.component.html',
    styleUrl: './booking-process.component.scss',
    animations: [
      trigger('slideHeader', [
        transition(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          animate('300ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 }))
        ])
      ]),
      trigger('slideContent', [
        transition(':enter', [
          style({ transform: 'translateY(100%)', opacity: 0 }),
          animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
        ]),
        transition(':leave', [
          animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
        ])
      ])
    ]
})
export class BookingProcessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    private seatMapService: AmadeusSeatmapService,
    public bookingHandler: BookingHandlerService,
    private promos: XploraPromosService,
    private _sb: MatSnackBar,
    private fireBooking: FireBookingService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private meta: MetaHandlerService,
    private gtag: Analytics,
    private fbp: FacebookPixelService
  ){}
  confirmationLoader:boolean=false;
  confirmationLoaderSteps:Step[]=[];
  booking?: FlightFirebaseBooking;
  bookingID?:string;
  passengers?:PassengerValue[];
  seatMaps!:SeatMap[];
  seatSelection?:SeatMapSavingData[];
  pendingSelectionSeats:number = 0;
  loadingSeats:boolean = false;
  contactInfo?: ContactInfoValue;
  activePromoCode?:string;
  spinnerIcon=faSpinner;
  nextIcon=faChevronRight;
  loadingProcess:boolean = false;
  paymentMethod:"CARD"|"CASH"|"SPEI"="CARD";
  passengersStepIcon = 'passengersStepIcon';
  steps = [
    { title: 'Pasajeros', content: 'passengers' },
    { title: 'Datos de Contacto', content: 'contact' },
    { title: 'Asientos', content: 'seats' },
    { title: 'Adicionales', content: 'extras' },
    { title: 'Pago', content: 'payment' }
  ];
  activeStep = 0;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild('extras') extras!: ExtrasComponent;
  @ViewChild('stepperContainer') container!: ElementRef;
  ngOnInit():void {
    this.meta.setMeta({
      title: "Xplora Travel || Completar Reservación",
      description: "Completa tu reservación de vuelo en Xplora Travel. Ingresa los datos de los pasajeros, selecciona asientos, agrega servicios adicionales y realiza el pago de forma segura y sencilla.",
      image: "https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fflights.jpg?alt=media&token=0defc707-55a6-4886-ac34-0507d3089aa3"
    })
    //this.sharedService.changeHeaderType("dark");
    this.sharedService.setBookingMode(true);
    this.sharedService.setLoading(true);
    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q])=>{
      const params:{bookingID:string} = p as {bookingID:string, step: Steps};
      const bookingID:string = params.bookingID;
      var actualStep:Steps="PASSENGERS";
      this.bookingID = bookingID;
      this.fireBooking.getBooking(bookingID).subscribe(booking=>{
        const passengersTotal = (booking.flightDetails?.passengers.counts.adults??0)+(booking.flightDetails?.passengers.counts.childrens??0)+(booking.flightDetails?.passengers.counts.infants??0);
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.sharedService.setLoading(false);
        if(q){
          const queryParams:{promo?:string} = q as {promo?:string};
          if(queryParams.promo!==undefined){
            this.getPromo(queryParams.promo);
          }
        }
        this.meta.setMeta({
          title: "Xplora Travel || Completar Reservación || Pasajeros"
        });
        if(booking.flightDetails?.passengers.details!==undefined){
          this.meta.setMeta({
            title: "Xplora Travel || Completar Reservación || Datos de Contacto"
          });
          if(booking.flightDetails?.passengers.details.length===passengersTotal){
            this.activeStep=1;
            if(booking.contact){
              if(booking.contact.email!==undefined&&booking.contact.phone!==undefined&&booking.contact.name!==undefined&&booking.contact.lastname!==undefined){
                this.activeStep=2;
                if(booking.flightDetails?.seatMaps!==undefined){
                  this.activeStep=4;
                }
              }
            }
          }
        }else{

        }
        if(booking.contact!==undefined){
          this.meta.setMeta({
            title: "Xplora Travel || Completar Reservación || Asientos"
          });
          actualStep="SEATS";
        }
        if(booking.flightDetails?.seatMaps!==undefined){
          this.meta.setMeta({
            title: "Xplora Travel || Completar Reservación || Realizar Pago"
          });
          actualStep="PAYMENT";
        }
        if(booking.flightDetails?.aditionalServices!==undefined){
          this.meta.setMeta({
            title: "Xplora Travel || Completar Reservación || Realizar Pago"
          });
          actualStep="PAYMENT";
        }
      });
      this.bookingHandler.booking.subscribe(booking=>{
        if(booking!==undefined){
          this.booking=booking;
        }
      });
    });
  }
  next() {
    if (this.activeStep < this.steps.length - 1) {
      this.scrollToTop();
      this.activeStep++;
    }
  }
  prev() {
    if (this.activeStep > 0) {
      this.scrollToTop();
      this.activeStep--;
    }
  }
  private scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    //this.container.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getPromo(promoCode:string){
    this.promos.getPromoByCode(promoCode).subscribe({
      next: promo =>{
        if(promo){
          this._sb.open('Promoción '+promo.code+' aplicada.', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(promo);
        }else{
          this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(undefined);
        }
      },
      error: err =>{
        //console.log(err);
        this.bookingHandler.setPromo(undefined);
        this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
      }
    })
  }
  changePaymentMethod(method:"CARD"|"CASH"|"SPEI"){
    this.booking!.created?.toDate().getTime();
    this.paymentMethod = method;  
  }
  startPayment(paymentInfo:PaymentProceesData){
    this.confirmationLoaderSteps = this.createBookingLoaderSteps(paymentInfo);
    this.confirmationLoader = true;
    let checkoutEvent:any = {
      currency: 'MXN',
      value: paymentInfo.amount
    }
    if(paymentInfo.promo){
      checkoutEvent.promo = paymentInfo.promo.code
    }
    const outboundFlight = this.booking!.flightDetails.flights.outbound!;
    const items:any[]=[{
      item_name: outboundFlight.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(outboundFlight.offer.itineraries[0].segments)!.arrival.iataCode,
      item_id: outboundFlight.offer.id,
      price: outboundFlight.offer.price.total as number,
      quantity: 1
    }];
    if(this.booking!.flightDetails.flights.inbound){
      items.push({
        item_name: this.booking!.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(this.booking!.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
        item_id: this.booking!.flightDetails.flights.inbound.offer.id,
        price: this.booking!.flightDetails.flights.inbound.offer.price.total as number,
        quantity: 1
      })
    }
    logEvent(this.gtag, 'begin_checkout',
      {
        currency: 'MXN',
        value: paymentInfo.amount,
        items
      }
    )
    this.fbp.track('Purchase', {
      value: paymentInfo.amount,
      currency: 'MXN'
    });
  }
  createBookingLoaderSteps(paymentInfo:PaymentProceesData):Step[]{
    const datesLine:StepTextElement[] = [
      {type: 'text', text: this.datePipe.transform(this.booking!.flightDetails!.departure.toDate(), 'mediumDate')!},
    ]
    if(this.booking!.flightDetails!.round&&this.booking!.flightDetails!.return!==undefined){
      datesLine.push({type: 'text', text: ' - '});
      datesLine.push({type: 'text', text: this.datePipe.transform(this.booking!.flightDetails!.return!.toDate(), 'mediumDate')!});
    }
    const passengersLine:StepTextElement[] = [
      {type: 'text', text: this.booking!.flightDetails!.passengers.counts.adults.toString()},
      {type: 'text', text: this.booking!.flightDetails!.passengers.counts.adults>1?' Adultos':' Adulto'}
    ]
    if(this.booking!.flightDetails!.passengers.counts.childrens>0){
      passengersLine.push({type: 'text', text: ' - '});
      passengersLine.push({type: 'text', text: this.booking!.flightDetails!.passengers.counts.childrens.toString()});
      passengersLine.push({type: 'text', text: this.booking!.flightDetails!.passengers.counts.childrens>1?' Menores':' Menor'});
    }
    if(this.booking!.flightDetails!.passengers.counts.infants>0){
      passengersLine.push({type: 'text', text: ' - '});
      passengersLine.push({type: 'text', text: this.booking!.flightDetails!.passengers.counts.infants.toString()});
      passengersLine.push({type: 'text', text: this.booking!.flightDetails!.passengers.counts.infants>1?' Infantes':' Infante'});
    }
    const flightLines: Line[] = this.booking!.flightDetails!.flights.outbound!.offer.itineraries[0].segments.map((segment, i) => {
      return {
        content: [
          {type: 'image', url: 'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/'+ (segment.operating ? segment.operating.carrierCode : segment.carrierCode) +'.svg', width: 30, height: 30},
          {type: 'text', text: (segment.operating ? segment.operating.carrierCode : segment.carrierCode)+segment.number, bold: true},
          {type: 'text', text: '('+segment.departure.iataCode+' - '+segment.arrival.iataCode+')', bold: false},
        ]
      }
    });
    if(this.booking!.flightDetails?.round&&this.booking!.flightDetails?.flights.inbound){
      this.booking!.flightDetails?.flights.inbound.offer.itineraries[0].segments.forEach((segment, i) => {
        flightLines.push({
          content: [
            {type: 'image', url: 'https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/'+ (segment.operating ? segment.operating.carrierCode : segment.carrierCode) +'.svg', width: 30, height: 30},
            {type: 'text', text: (segment.operating ? segment.operating.carrierCode : segment.carrierCode)+segment.number, bold: true},
            {type: 'text', text: '('+segment.departure.iataCode+' - '+segment.arrival.iataCode+')', bold: false}
          ]
        });
      });
    }
    const steps:Step[] = [
      {
        duration: 2000,
        title: 'Confirmando disponibilidad...',
        lines: [
          {
            content: [
              {type: 'text', text: this.booking!.flightDetails!.origin.address.cityName+' ('+this.booking!.flightDetails!.origin.address.countryName+')'},
              {type: 'text', text: ' - '},
              {type: 'text', text: this.booking!.flightDetails!.destination.address.cityName+' ('+this.booking!.flightDetails!.destination.address.countryName+')'}
            ]
          },
          {
            content: datesLine
          },
          {
            content: passengersLine
          }
        ]
      },
      {
        duration: 2000,
        title: 'Creando reservación...',
        lines: flightLines,
      }
    ];
    if(paymentInfo.paymentMethod==="CARD"&&paymentInfo.card){
      let cardTypeIcon;
      switch (paymentInfo.card.type) {
        case "visa":
          cardTypeIcon = faCcVisa;
          break;
        case "mastercard":
          cardTypeIcon = faCcMastercard;
          break;
        case "amex":
          cardTypeIcon = faCcAmex;
          break;
        case "dinersclub":
          cardTypeIcon = faCcDinersClub;
          break;
        case "discover":
          cardTypeIcon = faCcDiscover;
          break;
        case "jcb":
          cardTypeIcon = faCcJcb;
          break;
        default:
          break;
      }
      const paymentInfoLines:Line[] = [
        {
          content: [
            {type: 'icon', icon: cardTypeIcon},
            {type: 'text', text: paymentInfo.card!.number.slice(-4)}
          ]
        },
        {
          content: [
            {type: 'currency', amount: paymentInfo.amount}
          ]
        }
      ]
      if(paymentInfo.promo){
        paymentInfoLines.push({
          content: [
            {type: 'text', text: 'Promoción aplicada: '},
            {type: 'text', text: paymentInfo.promo.code, bold: true}
          ]
        })
      }
      steps.push({
        duration: 4000,
        title: 'Procesando pago...',
        lines: paymentInfoLines
      });
    }else if(paymentInfo.paymentMethod==="CASH"){
      const paymentInfoLines:Line[] = [
        {
          content: [
            {type: 'icon', icon: faMoneyBill},
            {type: 'text', text: 'Pago En Efectivo'}
          ]
        },
        {
          content: [
            {type: 'currency', amount: paymentInfo.amount}
          ]
        }
      ]
      if(paymentInfo.promo){
        paymentInfoLines.push({
          content: [
            {type: 'text', text: 'Promoción aplicada: '},
            {type: 'text', text: paymentInfo.promo.code, bold: true}
          ]
        })
      }
      steps.push({
        duration: 1500,
        title: 'Generando referencia de pago...',
        lines: paymentInfoLines
      });
    }else if(paymentInfo.paymentMethod==="SPEI"){
      const paymentInfoLines:Line[] = [
        {
          content: [
            {type: 'icon', icon: faBank},
            {type: 'text', text: 'Transferencia SPEI'}
          ]
        },
        {
          content: [
            {type: 'currency', amount: paymentInfo.amount}
          ]
        }
      ]
      if(paymentInfo.promo){
        paymentInfoLines.push({
          content: [
            {type: 'text', text: 'Promoción aplicada: '},
            {type: 'text', text: paymentInfo.promo.code, bold: true}
          ]
        })
      }
      steps.push({
        duration: 1500,
        title: 'Generando referencia de pago...',
        lines: paymentInfoLines
      });
    }
    return steps;
  }
  completeLoader(){
    navigator.vibrate(400);
  }
  processPassengers(){
    if(this.passengers!==undefined){
      this.sharedService.setLoading(true);
      const passengersData = this.passengers.map((passenger, i) => {
        return {
          name: passenger.name,
          lastname: passenger.lastname,
          birth: passenger.birth,
          gender: passenger.gender,
          type: passenger.type,
          id: i+1
        }
      });
      let data:Partial<FlightFirebaseBooking> = {
        flightDetails: {
          ...this.booking!.flightDetails!,
          passengers: {
            counts: this.booking!.flightDetails!.passengers.counts,
            details: passengersData
          }
        }
      }
      this.fireBooking.updateBooking(this.bookingID!, data).then((result)=>{
        this.sharedService.setLoading(false);
        this.next();
        this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      }).catch((err)=>{
        //console.log(err);
        this.sharedService.setLoading(false);
        this._sb.open('Error al guardar los pasajeros. Intente nuevamente.', 'OK', {duration: 1500});
      });
      if(!this.booking?.flightDetails){
        this.fireBooking.nestedUpdateBooking(this.bookingID!, {
          "flightDetails.aditionalServices": {
            insurance: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'INSURANCE',
                  unitPrice: ExtrasPrices.insurance,
                  active: false
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'INSURANCE',
                  unitPrice: ExtrasPrices.insurance,
                  active: false
                }
              }) : []
            },
            baggage: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'BAGGAGE',
                  unitPrice: ExtrasPrices.baggage,
                  active: false,
                  value: 0
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'BAGGAGE',
                  unitPrice: ExtrasPrices.baggage,
                  active: false,
                  value: 0
                }
              }) : []
            },
            carryOn: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'CARRYON',
                  unitPrice: ExtrasPrices.carryon,
                  active: false,
                  value: 0
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'CARRYON',
                  unitPrice: ExtrasPrices.carryon,
                  active: false,
                  value: 0
                }
              }) : []
            },
            flexpass: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'FLEXPASS',
                  unitPrice: ExtrasPrices.flexpass,
                  active: false
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'FLEXPASS',
                  unitPrice: ExtrasPrices.flexpass,
                  active: false
                }
              }) : []
            }
          }
        })
      }
    }
  }
  openInsuranceFromSidebar(){
    this.activeStep=3;
    this.extras.openInsurance();
  }
  validContact(event:any){
    //console.log(event);
  }
  goToPassengers(){
    this.activeStep=0;
  }
  processContact(){
    if(this.contactInfo){
      this.sharedService.setLoading(true);
      this.fireBooking.updateBooking(this.bookingID!, {
        contact: this.contactInfo
      }).then((result)=>{
        this.next();
        let total = this.booking!.flightDetails.flights.outbound!.offer.price.total as number;
        if(this.booking?.flightDetails.flights.inbound){
          total+=this.booking.flightDetails.flights.inbound.offer.price.total as number;
        }
        logEvent(this.gtag, 'add_shipping_info', {
          currency: 'MXN',
          value: total 
        });
        this.fbp.track('Lead', {
          currency: 'MXN',
          value: total
        })
        this.sharedService.setLoading(false);
        //this.next();
        this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      }).catch((err)=>{
        //console.log(err);
        this.loadingProcess=false;
        this._sb.open('Error al guardar los datos de contacto. Intente nuevamente.', 'OK', {duration: 1500});
      });
    }
  }
  seatsHaveChanges(oldSeatMaps:SeatMapSavingData[], newSeatMaps:SeatMapSavingData[]) {
    let hasChanges = false;
    // Verificar que ambos tengan el mismo número de entradas en seatSelection
    if(oldSeatMaps === undefined) return true;
    if (oldSeatMaps.length !== newSeatMaps.length) return true;
    // Mapear cada seatSelection por passengerID y número de asiento
    oldSeatMaps.forEach((seatMap, seatMapI)=>{
      seatMap.selectedSeats.filter(selection=>selection.seat!==undefined).forEach((selection, selectionI)=>{
        const isDifferent:boolean = newSeatMaps[seatMapI].selectedSeats[selectionI].seat!.number!==selection.seat!.number;
        hasChanges = isDifferent;
      });
    });
    return hasChanges;
  }
  skipStep(step?:Steps){
    if(step==="EXTRAS"||step==="SEATS"){
      switch (step) {
        case "SEATS":
          this.fireBooking.updateBooking(this.bookingID!, {
            flightDetails: {
              ...this.booking!.flightDetails!,
              seatMaps: []
            }
          }).then(updated=>{
            this.bookingHandler.setBookingInfo(updated as FlightFirebaseBooking);
            this.activeStep=4;
          }).catch(err=>{
            retry(3);
            //console.log(err);
            //this._sb.open('Error al guardar los asientos seleccionados. Intente nuevamente.', 'OK', {duration: 1500});
          });
          break;
        case "EXTRAS":
          this.activeStep=4;
          break;
      }
    }else{
      this.next();
    }
  }
  saveSeats(){
    this.sharedService.setLoading(true);
    this.fireBooking.updateBooking(this.bookingID!, {
      flightDetails: {
        ...this.booking!.flightDetails!,
        seatMaps: this.seatSelection ?? []
      }
    }).then(updated=>{
      this.bookingHandler.setBookingInfo(updated as FlightFirebaseBooking);
      this.activeStep=4;
      this.sharedService.setLoading(false);
    }).catch(err=>{ 
      //console.log(err);
      this._sb.open('Error al guardar los asientos seleccionados. Intente nuevamente.', 'OK', {duration: 1500});
    });
  }
  processSeats(){
    if(this.pendingSelectionSeats){
      this.dialog.open(SeatPendingDialog, {width: '300px', data: this.pendingSelectionSeats}).afterClosed().subscribe(result=>{
        if(result){
          this.saveSeats();
        }else{
          this._sb.open('Seleccione los asientos faltantes antes de continuar', 'Aceptar', {duration: 2000});
        }
      });
    }else{
      this.saveSeats();
    }
  }
    
}
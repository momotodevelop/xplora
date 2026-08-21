import { Component, OnInit, ViewChild } from '@angular/core';
import { PassengerValue, PassengersComponent } from './passengers/passengers.component';
import { BookingSidebarComponent } from './booking-sidebar/booking-sidebar.component';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SharedDataService } from '../../services/shared-data.service';
import { CommonModule, DatePipe } from '@angular/common';
import { SeatPendingDialog } from './seats/seats.component';
import { SeatMap, SeatMapSavingData } from '../../types/amadeus-seat-map.types';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { ContactInfoValue } from './contact-info/contact-info.component';
import { PaymentProceesData } from './payment/payment.component';
import { XploraPromosService } from '../../services/xplora-promos.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, filter } from 'rxjs';
import { faMoneyBill, faBank } from '@fortawesome/free-solid-svg-icons';
import { FireBookingService } from '../../services/fire-booking.service';
import { FlightFirebaseBooking, PaymentMethod } from '../../types/booking.types';
import { BookingCreationLoaderComponent, Line, Step, StepTextElement } from '../../shared/booking-creation-loader/booking-creation-loader.component';
import { MatDialog } from '@angular/material/dialog';
import { faCcVisa, faCcAmex, faCcDiscover, faCcJcb, faCcMastercard, faCcDinersClub } from '@fortawesome/free-brands-svg-icons';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { FacebookPixelService } from '../../services/facebook-pixel.service';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { sha256 } from 'js-sha256';
import { XploraPaymentConfigService } from '../../services/xplora-payment-config.service';
import { DEFAULT_PAYMENT_CONFIG } from '../../types/payment-config.types';

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
        BookingSidebarComponent,
        CommonModule,
        BookingCreationLoaderComponent,
        RouterOutlet
    ],
    templateUrl: './booking-process.component.html',
    styleUrl: './booking-process.component.scss',
})
export class BookingProcessComponent implements OnInit {
  private getLastArrivalCode(segments: { arrival: { iataCode: string } }[]): string {
    return segments[segments.length - 1]?.arrival.iataCode ?? '';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sharedService: SharedDataService,
    public bookingHandler: BookingHandlerService,
    private promos: XploraPromosService,
    private _sb: MatSnackBar,
    private fireBooking: FireBookingService,
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private meta: MetaHandlerService,
    private gtag: Analytics,
    private fbp: FacebookPixelService,
    private GoogleTagService: GoogleTagManagerService,
    private paymentConfigService: XploraPaymentConfigService
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
  private savingSeats:boolean = false;
  contactInfo?: ContactInfoValue;
  activePromoCode?:string;
  loadingProcess:boolean = false;
  paymentMethod:PaymentMethod="CARD";
  speiPaymentTimeMinutes = DEFAULT_PAYMENT_CONFIG.speiPaymentTimeMinutes;
  get speiPaymentTimeSeconds(): number {
    return this.speiPaymentTimeMinutes * 60;
  }
  passengersStepIcon = 'passengersStepIcon';
  readonly steps: Array<{ id: Steps; path: string; title: string }> = [
    { id: 'CONTACT', path: 'titular', title: 'Titular de la reservación' },
    { id: 'PASSENGERS', path: 'pasajeros', title: 'Pasajeros' },
    { id: 'SEATS', path: 'asientos', title: 'Asientos' },
    { id: 'EXTRAS', path: 'adicionales', title: 'Adicionales' },
    { id: 'PAYMENT', path: 'pago', title: 'Elige cómo pagar' }
  ];
  readonly stepContext = this;
  activeStep = 0;
  flowReady = false;
  contactStepComplete = false;
  passengersStepComplete = false;
  seatsStepComplete = false;
  extrasStepComplete = false;
  @ViewChild(RouterOutlet) stepOutlet?: RouterOutlet;
  private insuranceRequestPending = false;
  private readonly baseDescription = 'Completa tu reservación de vuelo en Xplora Travel. Ingresa los datos de los pasajeros, selecciona asientos, agrega servicios adicionales y realiza el pago de forma segura y sencilla.';
  private readonly baseImage = 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fflights.jpg?alt=media&token=0defc707-55a6-4886-ac34-0507d3089aa3';

  ngOnInit():void {
    this.paymentConfigService.watchPaymentConfig().subscribe(config => {
      this.speiPaymentTimeMinutes = config.speiPaymentTimeMinutes;
    });

    this.meta.setMeta({
      title: "Xplora Travel || Completar Reservación",
      description: this.baseDescription,
      image: this.baseImage
    })

    this.sharedService.setBookingMode(true);
    this.sharedService.setLoading(true);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.flowReady) {
        this.synchronizeStepWithRoute();
      }
    });

    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.booking=booking;
      }
    });

    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q])=>{
      const params:{bookingID:string} = p as {bookingID:string};
      const bookingID:string = params.bookingID;
      this.bookingID = bookingID;
      this.fireBooking.getBooking(bookingID).subscribe(async booking=>{
        const flightBooking = booking as FlightFirebaseBooking;
        const passengersTotal = (booking.flightDetails?.passengers.counts.adults??0)+(booking.flightDetails?.passengers.counts.childrens??0)+(booking.flightDetails?.passengers.counts.infants??0);
        if(q){
          const queryParams:{promo?:string} = q as {promo?:string};
          if(queryParams.promo!==undefined){
            this.getPromo(queryParams.promo);
          }
        }
        this.contactStepComplete = this.isContactComplete(booking.contact);
        this.passengersStepComplete = Boolean(
          booking.flightDetails?.passengers.details?.length === passengersTotal
          && booking.flightDetails.passengers.details.every(passenger =>
            passenger.name && passenger.lastname && passenger.birth && passenger.gender
          )
        );
        this.seatsStepComplete = booking.flightDetails?.seatMaps !== undefined;
        this.extrasStepComplete = booking.flightDetails?.aditionalServices !== undefined;

        if (this.contactStepComplete) this.contactInfo = booking.contact;
        if (this.passengersStepComplete) this.passengers = booking.flightDetails?.passengers.details;

        this.booking = flightBooking;
        this.bookingHandler.setBookingInfo(flightBooking);

        const requestedStep = this.getRouteStepIndex();
        const furthestAvailableStep = this.getFurthestAvailableStep();
        const initialStep = requestedStep !== undefined && requestedStep <= furthestAvailableStep
          ? requestedStep
          : furthestAvailableStep;

        if (requestedStep !== initialStep) {
          await this.navigateToStep(initialStep, true, false);
        } else {
          this.activeStep = initialStep;
          this.updateStepMeta();
        }

        this.flowReady = true;
        this.sharedService.setLoading(false);
      });
    });
  }

  next(): void {
    if (this.activeStep < this.steps.length - 1) {
      void this.navigateToStep(this.activeStep + 1);
    }
  }

  prev(): void {
    if (this.activeStep > 0) {
      void this.navigateToStep(this.activeStep - 1);
    }
  }

  async navigateToStep(stepIndex: number, replaceUrl = false, shouldScroll = true): Promise<boolean> {
    const step = this.steps[stepIndex];
    if (!step) return false;

    this.activeStep = stepIndex;
    this.updateStepMeta();
    if (shouldScroll) this.scrollToTop();

    return this.router.navigate([step.path], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
      replaceUrl
    });
  }

  onContactValidity(contact: ContactInfoValue | undefined): void {
    this.contactInfo = contact;
    this.contactStepComplete = this.contactMatchesBooking(contact);
  }

  onPassengersValidity(passengers: PassengerValue[] | undefined): void {
    this.passengers = passengers;
    this.passengersStepComplete = this.passengersMatchBooking(passengers);
  }

  completeExtrasStep(): void {
    this.extrasStepComplete = true;
    this.navigateAfterCompletingStep(4);
  }

  private synchronizeStepWithRoute(): void {
    const requestedStep = this.getRouteStepIndex();
    const furthestAvailableStep = this.getFurthestAvailableStep();

    if (requestedStep === undefined || requestedStep > furthestAvailableStep) {
      void this.navigateToStep(furthestAvailableStep, true);
      return;
    }

    this.activeStep = requestedStep;
    this.updateStepMeta();
    this.scrollToTop();
  }

  private getRouteStepIndex(): number | undefined {
    const requestedStep = this.route.firstChild?.snapshot.data['step'] as Steps | undefined;
    if (!requestedStep) return undefined;

    const index = this.steps.findIndex(step => step.id === requestedStep);
    return index >= 0 ? index : undefined;
  }

  private getFurthestAvailableStep(): number {
    if (!this.contactStepComplete) return 0;
    if (!this.passengersStepComplete) return 1;
    if (!this.seatsStepComplete) return 2;
    if (!this.extrasStepComplete) return 3;
    return 4;
  }

  private updateStepMeta(): void {
    this.meta.setMeta({
      title: `Xplora Travel || Completar Reservación || ${this.steps[this.activeStep].title}`,
      description: this.baseDescription,
      image: this.baseImage
    });
  }

  private scrollToTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
  changePaymentMethod(method:PaymentMethod){
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
      item_name: outboundFlight.offer.itineraries[0].segments[0].departure.iataCode+'-'+this.getLastArrivalCode(outboundFlight.offer.itineraries[0].segments),
      item_id: outboundFlight.offer.id,
      price: outboundFlight.offer.price.total as number,
      quantity: 1
    }];
    if(this.booking!.flightDetails.flights.inbound){
      items.push({
        item_name: this.booking!.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+'-'+this.getLastArrivalCode(this.booking!.flightDetails.flights.inbound.offer.itineraries[0].segments),
        item_id: this.booking!.flightDetails.flights.inbound.offer.id,
        price: this.booking!.flightDetails.flights.inbound.offer.price.total as number,
        quantity: 1
      })
    }
    logEvent(this.gtag, 'Purchase',
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
    this.GoogleTagService.getDataLayer().push({
      event: 'Purchase',
      transaction_id: this.bookingID,
      value: paymentInfo.amount,
      currency: 'MXN',
      user_data: {
        sha256_email_address: sha256(this.booking!.contact!.email),
        sha256_phone_number: sha256(this.booking!.contact!.phone)
      },
      items
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
    }else if(paymentInfo.paymentMethod==="DEFERRED" && paymentInfo.deferredPlan){
      steps.push({
        duration: 1500,
        title: 'Guardando calendario de pagos...',
        lines: [
          {
            content: [
              {type: 'icon', icon: faBank},
              {type: 'text', text: 'Plan de pagos diferidos'}
            ]
          },
          {
            content: [
              {type: 'text', text: 'Anticipo: '},
              {type: 'currency', amount: paymentInfo.deferredPlan.downPaymentAmount}
            ]
          },
          {
            content: [
              {type: 'text', text: `${paymentInfo.deferredPlan.installments.length} pagos programados`}
            ]
          }
        ]
      });
    }
    return steps;
  }
  completeLoader(){
    navigator.vibrate(400);
  }
  async processPassengers(passengersForm?: PassengersComponent): Promise<void> {
    if (!this.passengers || !this.bookingID || !this.booking?.flightDetails) return;

    this.sharedService.setLoading(true);
    try {
      const passengerValues = passengersForm
        ? await passengersForm.persistRequestedPassengers()
        : this.passengers;
      const passengersData: PassengerValue[] = passengerValues.map((passenger, index) => ({
        name: passenger.name,
        lastname: passenger.lastname,
        birth: passenger.birth,
        gender: passenger.gender,
        type: passenger.type,
        id: index + 1,
        ...(passenger.savedPassengerRef ? { savedPassengerRef: passenger.savedPassengerRef } : {})
      }));
      const result = await this.fireBooking.updateBooking(this.bookingID, {
        flightDetails: {
          ...this.booking.flightDetails,
          passengers: {
            counts: this.booking.flightDetails.passengers.counts,
            details: passengersData
          }
        }
      });
      this.passengers = passengersData;
      this.passengersStepComplete = true;
      this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      this.navigateAfterCompletingStep(2);
    } catch (error) {
      console.error('Error al guardar los pasajeros', error);
      this._sb.open('Error al guardar los pasajeros. Intente nuevamente.', 'OK', { duration: 2000 });
    } finally {
      this.sharedService.setLoading(false);
    }
  }
  openInsuranceFromSidebar(){
    if (!this.contactStepComplete || !this.passengersStepComplete || !this.seatsStepComplete) {
      this._sb.open('Completa los pasos anteriores antes de agregar adicionales.', 'OK', { duration: 2000 });
      return;
    }

    if (this.activeStep === 3) {
      const activeStep = this.stepOutlet?.component as { openInsurance?: () => void } | undefined;
      activeStep?.openInsurance?.();
      return;
    }

    this.insuranceRequestPending = true;
    void this.navigateToStep(3);
  }

  consumeInsuranceRequest(): boolean {
    const requested = this.insuranceRequestPending;
    this.insuranceRequestPending = false;
    return requested;
  }
  validContact(event:any){
    //console.log(event);
  }
  goToPassengers(){
    void this.navigateToStep(1);
  }
  async processContact(): Promise<void> {
    if (!this.contactInfo || !this.bookingID || !this.booking || this.loadingProcess) return;

    const contact = this.contactInfo;
    this.loadingProcess = true;
    this.sharedService.setLoading(true);

    try {
      const result = await this.fireBooking.updateBooking(this.bookingID, { contact });
      this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      this.contactInfo = contact;
      this.contactStepComplete = true;
      this.navigateAfterCompletingStep(1);
      this.trackContactCompletion();
    } catch (error) {
      console.error('Error al guardar los datos de contacto', error);
      this._sb.open('No pudimos guardar tus datos de contacto. Inténtalo nuevamente.', 'OK', { duration: 2500 });
    } finally {
      this.loadingProcess = false;
      this.sharedService.setLoading(false);
    }
  }

  private trackContactCompletion(): void {
    const outboundTotal = Number(this.booking?.flightDetails.flights.outbound?.offer.price.total ?? 0);
    const inboundTotal = Number(this.booking?.flightDetails.flights.inbound?.offer.price.total ?? 0);
    const total = outboundTotal + inboundTotal;

    try {
      logEvent(this.gtag, 'add_shipping_info', {
        currency: 'MXN',
        value: total
      });
      this.fbp.track('Lead', {
        currency: 'MXN',
        value: total
      });
    } catch (error) {
      console.warn('No se pudo registrar la analítica de contacto', error);
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
          this.persistSeatMaps([]);
          break;
        case "EXTRAS":
          this.completeExtrasStep();
          break;
      }
    }else{
      this.next();
    }
  }
  saveSeats(){
    this.persistSeatMaps(this.seatSelection ?? []);
  }
  private persistSeatMaps(seatMaps: SeatMapSavingData[]): void {
    if(this.savingSeats){
      return;
    }
    if(!this.bookingID){
      this._sb.open('No se encontró la reservación. Recargue la página e intente nuevamente.', 'OK', {duration: 2500});
      return;
    }

    this.savingSeats = true;
    this.loadingSeats = true;
    this.sharedService.setLoading(true);
    this.fireBooking.nestedUpdateBooking(this.bookingID, {
      'flightDetails.seatMaps': seatMaps
    }).then(updated=>{
      this.seatsStepComplete = true;
      this.bookingHandler.setBookingInfo(updated as FlightFirebaseBooking);
      const nextStep = (updated as FlightFirebaseBooking).flightDetails?.aditionalServices!==undefined ? 4 : 3;
      this.navigateAfterCompletingStep(nextStep);
    }).catch(err=>{
      console.error('Error al guardar los asientos seleccionados', err);
      this._sb.open('Error al guardar los asientos seleccionados. Intente nuevamente.', 'OK', {duration: 2500});
    }).finally(()=>{
      this.savingSeats = false;
      this.loadingSeats = false;
      this.sharedService.setLoading(false);
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

  private isContactComplete(contact: ContactInfoValue | undefined): contact is ContactInfoValue {
    return Boolean(contact?.name && contact.lastname && contact.email && contact.phone && contact.country_code);
  }

  private navigateAfterCompletingStep(stepIndex: number): void {
    void this.navigateToStep(stepIndex);
  }

  private contactMatchesBooking(contact: ContactInfoValue | undefined): boolean {
    if (!this.isContactComplete(contact) || !this.isContactComplete(this.booking?.contact)) return false;
    return (Object.keys(contact) as Array<keyof ContactInfoValue>).every(key =>
      String(contact[key] ?? '').trim() === String(this.booking!.contact![key] ?? '').trim()
    );
  }

  private passengersMatchBooking(passengers: PassengerValue[] | undefined): boolean {
    const savedPassengers = this.booking?.flightDetails?.passengers.details;
    if (!passengers || !savedPassengers || passengers.length !== savedPassengers.length) return false;

    return passengers.every((passenger, index) => {
      const saved = savedPassengers[index];
      const birth = passenger.birth instanceof Date ? passenger.birth : passenger.birth.toDate();
      const savedBirth = saved.birth instanceof Date ? saved.birth : saved.birth.toDate();
      return !passenger.saveToSavedPassengers
        && passenger.name.trim() === saved.name.trim()
        && passenger.lastname.trim() === saved.lastname.trim()
        && passenger.gender === saved.gender
        && birth.getTime() === savedBirth.getTime()
        && (passenger.savedPassengerRef?.path ?? '') === (saved.savedPassengerRef?.path ?? '');
    });
  }
    
}

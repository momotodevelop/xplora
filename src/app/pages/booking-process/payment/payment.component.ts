import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraPaymentsService } from '../../../services/xplora-payments.service';
import { debounceTime, filter, first } from 'rxjs';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Promo } from '../../../services/xplora-promos.service';
import { DiscountsMP, PaymentData } from '../../../types/mp.types';
import { environment } from '../../../../environments/environment';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faMoneyBillTransfer, faMoneyBills, faCreditCard, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { v4 as uuid } from 'uuid';
import { SharedDataService } from '../../../services/shared-data.service';
import { Charge } from '../booking-sidebar/booking-sidebar.component';
import { XploraApiService } from '../../../services/xplora-api.service';
import {MatTabsModule} from '@angular/material/tabs';
import { MatExpansionModule, MatExpansionPanel} from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Payment as PaymentResponse } from '../../../types/mp-response.types'
import  * as _  from 'lodash';
import { PdfGeneratorService } from '../../../services/pdf-generator.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { PaymentDetails } from '../../../services/clip-sdk.service';
import {
  BookingStatus,
  DeferredPaymentFrequency,
  DeferredPaymentPlan,
  FlightFirebaseBooking,
  PaymentMethod
} from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';
import { FireAuthService } from '../../../services/fire-auth.service';
import { User } from '@angular/fire/auth';
import { NotificationService } from '../../../services/notifications.service';
import { Timestamp } from 'firebase/firestore';
import { Item, logEvent } from 'firebase/analytics';
import { Analytics } from '@angular/fire/analytics';
import { PendingPaymentEmailData } from '../../../types/email-data.types';
import { WhatsAppUrlManagerService } from '../../../services/whatsapp-url-manager.service';
import { DEFAULT_PAYMENT_CONFIG, PaymentOffice } from '../../../types/payment-config.types';
import { XploraPaymentOfficesService } from '../../../services/xplora-payment-offices.service';
import { LinkedInConversionsService } from '../../../services/linkedin-conversions.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  DeferredPaymentEligibility,
  DeferredPaymentPlanService
} from '../../../services/deferred-payment-plan.service';
import { DeferredPaymentTermsDialogComponent } from './deferred-payment-terms-dialog.component';
import {
  XploraGatewayAttemptLimitError,
  XploraGatewayComponent,
  XploraGatewayValidationError
} from '../../../shared/xplora-gateway/xplora-gateway.component';

export type AvailablePaymentMethods = "CASH"|"CARD"|"SPEI"|"DEFERRED";

export interface confirmationEmailData {
  pnr: string,
  name: string,
  year: string,
  total: string,
  status: string,
  locator: string,
  service: string,
  bookingURL: string,
  paymentURL: string,
  receiptLink: string,
  whatsappURL: string,
  account_name: string
}

export interface PaymentProceesData{
  paymentMethod: PaymentMethod,
  amount: number,
  office?: string,
  card?: PaymentDetails,
  promo?: Promo,
  deferredPlan?: DeferredPaymentPlan
}


declare const MercadoPago: any;
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
        MatExpansionModule,
        MatIconModule,
        MatExpansionModule,
        MatCheckboxModule,
        FormsModule,
        MatListModule,
        MatDialogModule,
        XploraGatewayComponent
    ],
    templateUrl: './payment.component.html',
    styleUrl: './payment.component.scss',
    providers: [CurrencyPipe, UpperCasePipe]
})
export class PaymentComponent implements OnInit {
  @ViewChild('panelTarjeta') panelTarjeta!:MatExpansionPanel;
  @ViewChild('panelEfectivo') panelEfectivo!:MatExpansionPanel;
  @ViewChild('panelSpei') panelSpei!:MatExpansionPanel;
  @ViewChild('panelDeferred') panelDeferred!:MatExpansionPanel;
  @ViewChild('paymentOfficeList') list!: MatSelectionList;
  @ViewChild(XploraGatewayComponent) gateway?: XploraGatewayComponent;
  @Input() speiPaymentTimeMinutes = DEFAULT_PAYMENT_CONFIG.speiPaymentTimeMinutes;
  @Output() selectedPaymentMethod:EventEmitter<PaymentMethod> = new EventEmitter<PaymentMethod>(false);
  @Output() paymentProcessStart:EventEmitter<PaymentProceesData> = new EventEmitter<PaymentProceesData>()
  total:number=0;
  spinnerIcon=faSpinner;
  cardIcon=faCreditCard;
  speiIcon=faMoneyBillTransfer;
  cashIcon=faMoneyBills;
  deferredIcon=faCalendarDays;
  loading:boolean=false;
  bookingID?:string;
  chargeResume?:Charge[];
  user?:User;
  selectedPayment?: AvailablePaymentMethods = 'CARD';
  allPaymentOffices: PaymentOffice[] = [];
  paymentOffices: PaymentOffice[] = [];
  selectedPaymentOffice?:string;
  booking!:FlightFirebaseBooking;
  cardGatewayValid = false;
  activePromo?:Promo;
  discounted:number=0;
  deferredEligibility?: DeferredPaymentEligibility;
  deferredPlans: DeferredPaymentPlan[] = [];
  selectedDeferredFrequency?: DeferredPaymentFrequency;
  acceptedDeferredTerms = false;
  constructor(
    public bookingHandler: BookingHandlerService,
    private payments: XploraPaymentsService,
    private currency: CurrencyPipe,
    private snackbar: MatSnackBar,
    private shared: SharedDataService,
    private xplora: XploraApiService,
    private datePipe: DatePipe,
    private title: TitleCasePipe,
    private uppercase: UpperCasePipe,
    private notifications: NotificationService,
    private pdf:PdfGeneratorService,
    private fileUpload: FileUploadService,
    private fireBooking: FireBookingService,
    private auth: FireAuthService,
    private gtag: Analytics,
    private wa: WhatsAppUrlManagerService,
    private paymentOfficesService: XploraPaymentOfficesService,
    private linkedInConversions: LinkedInConversionsService,
    private deferredPaymentPlans: DeferredPaymentPlanService,
    private dialog: MatDialog
  ){
    
  }
  ngOnInit(): void {
    this.auth.user.subscribe(user=>{
      this.user = user ?? undefined;
    });
    this.paymentOfficesService.watchOffices().subscribe(offices => {
      const normalized = [...(offices ?? [])]
        .filter(office => office.active !== false)
        .sort((a, b) => (a.fee ?? 0) - (b.fee ?? 0));
      this.allPaymentOffices = normalized;
      if (this.selectedPaymentOffice) {
        const exists = normalized.some(office => office.id === this.selectedPaymentOffice);
        if (exists) {
          this.paymentOffices = normalized.filter(office => office.id === this.selectedPaymentOffice);
        } else {
          this.paymentOffices = normalized;
          this.selectedPaymentOffice = undefined;
          this.list?.deselectAll();
        }
      } else {
        this.paymentOffices = normalized;
      }
    });
    this.bookingHandler.promo.subscribe(promo=>{
      this.activePromo = promo;
    });
    this.bookingHandler.prices.pipe(debounceTime(1500)).subscribe(prices=>{
      this.total = prices[0];
      this.discounted = prices[1];
      if(prices[0]>0){
        this.bookingHandler.booking.pipe(
          filter((booking): booking is FlightFirebaseBooking => !!booking),
          first()
        ).subscribe(booking=>{
          this.booking = booking;
          this.bookingID=booking.bookingID;
          this.refreshDeferredPaymentPlans();
          if(booking.contact&&prices[0]>0){
            const pnr:string = booking.bookingID!.slice(-6).toUpperCase();
              /* this.payments.createPreferenceMP(preferenceData).subscribe(preference=>{
                this.initializeMercadoPago(preference.id, [prices[0], prices[1]], preferenceData.contact_info, pnr, prices[2]);
              }); */
            // this.initializeClipPayment(prices[0], true, true);
            if(booking){}
          }
        });
      }
    });
    this.bookingHandler.charges.subscribe(charges=>{
      this.chargeResume=charges;
    });
  }
  getBookingStatusText(status:BookingStatus){
    switch(status){
      case "PENDING":
        return "Pendiente";
      case "HOLD":
        return "En Espera";
      case "CONFIRMED":
        return "Confirmada";
      case "CANCELED":
        return "Cancelada";
      case "REJECTED":
        return "Rechazada";
      default:
        return "";
    }
  }
  changePayment(event:AvailablePaymentMethods){
    this.selectedPayment=event;
    this.selectedPaymentMethod.emit(event);
    switch(event){
      case 'CARD':
        this.panelTarjeta.open();
        this.panelTarjeta.toggle();
      break;
      case 'CASH':
        this.panelEfectivo.open();
        this.panelEfectivo.toggle();
      break;
      case 'SPEI':
        this.panelSpei.open();
        this.panelSpei.toggle();
      break;
      case 'DEFERRED':
        this.panelDeferred.open();
        this.panelDeferred.toggle();
      break;
    }
  }
  async makePaymentFirebase(): Promise<void> {
    if (!this.selectedPayment || !this.bookingID || this.loading) {
      this.snackbar.open('Selecciona una forma de pago para continuar.', 'OK', {duration: 2500});
      return;
    }

    if (this.selectedPayment === 'CARD' && (!this.gateway || !this.gateway.isComplete)) {
      this.gateway?.markAllAsTouched();
      this.snackbar.open(
        'Completa correctamente los datos de la tarjeta y la dirección de facturación.',
        'OK',
        {duration: 3500}
      );
      return;
    }

    if (this.selectedPayment === 'DEFERRED' && !this.canConfirmDeferredPlan) {
      this.snackbar.open('Selecciona un calendario y acepta los términos del plan de pagos.', 'OK', {duration: 2500});
      return;
    }

    const outboundFlight = this.booking!.flightDetails!.flights.outbound!;
    const inboundFlight = this.booking!.flightDetails!.flights.outbound!;
    const items:Item[]  = [
      {
        index: 0,
        price: outboundFlight.offer.price.total as number,
        item_name: outboundFlight.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(outboundFlight.offer.itineraries[0].segments)!.arrival.iataCode,
        item_category: 'Vuelo de Ida',
        item_brand: outboundFlight.offer.validatingAirlineCodes[0],
        coupon: this.activePromo?.code ?? undefined
      }
    ]
    if(inboundFlight){
      items.push({
        index: 1,
        price: inboundFlight.offer.price.total as number,
        item_name: inboundFlight.offer.itineraries[0].segments[0].departure.iataCode+'-'+_.last(inboundFlight.offer.itineraries[0].segments)!.arrival.iataCode,
        item_category: 'Vuelo de Regreso',
        item_brand: inboundFlight.offer.validatingAirlineCodes[0],
        coupon: this.activePromo?.code ?? undefined
      })
    }
    logEvent(this.gtag, 'purchase', {
      transaction_id: this.bookingID!,
      currency: 'MXN',
      value: this.total as number,
      items
    });
    this.linkedInConversions.trackFlightBookingPending({
      amount: this.total,
      bookingId: this.bookingID!,
      email: this.booking.contact?.email,
      firstName: this.booking.contact?.name,
      lastName: this.booking.contact?.lastname
    }).subscribe();

    const paymentProcessData: PaymentProceesData = {
      amount: this.total,
      paymentMethod: this.selectedPayment,
      card: this.selectedPayment === 'CARD' ? this.gateway?.paymentDetails : undefined,
      promo: this.activePromo,
      deferredPlan: this.selectedPayment === 'DEFERRED' ? this.selectedDeferredPlan : undefined
    };
    const selectedDeferredPlan = this.selectedPayment === 'DEFERRED'
      ? this.createAcceptedDeferredPlan()
      : undefined;
    const bookingUpdateData:Partial<FlightFirebaseBooking>={
      payment: {
        amount: this.total,
        originalAmount: this.total+this.discounted,
        type: this.selectedPayment === 'DEFERRED' ? 'DELAYED' : 'NOW',
        office: this.selectedPaymentOffice ?? 'NA',
        totalDue: this.total,
        method: this.selectedPayment,
        payed: 0,
        status: 'PENDING',
        paymentLimit: selectedDeferredPlan?.payoffDate ?? this.paymentLimitByPaymentType(this.selectedPayment),
        ...(selectedDeferredPlan ? { deferredPlan: selectedDeferredPlan } : {})
      },
      charges: this.chargeResume,
      status: 'PENDING',
      created: new Timestamp(Math.round(new Date().getTime()/1000), 0),
    };
    if(this.user){
      bookingUpdateData.uid = this.user.uid;
    }
    if(this.activePromo){
      bookingUpdateData.payment!.promo = this.activePromo;
    }

    this.loading = true;
    try {
      const updatedBooking = await this.fireBooking.updateBooking(this.bookingID, bookingUpdateData);
      if (this.selectedPayment === 'CARD') {
        await this.gateway!.savePayment();
      }
      this.paymentProcessStart.emit(paymentProcessData);
      await this.confirmBooking(updatedBooking as FlightFirebaseBooking, this.selectedPayment === 'CARD');
    } catch (error) {
      this.loading = false;
      if (error instanceof XploraGatewayAttemptLimitError) {
        this.snackbar.open(
          'Ya se registró el intento inicial con tarjeta. Continúa desde las opciones de pago de tu reservación.',
          'OK',
          {duration: 5000}
        );
      } else if (error instanceof XploraGatewayValidationError) {
        this.snackbar.open(
          'Revisa los datos de la tarjeta y la dirección de facturación.',
          'OK',
          {duration: 3500}
        );
      } else {
        console.error('No fue posible registrar la reservación:', error);
        this.snackbar.open('No fue posible procesar tu reservación. Inténtalo nuevamente.', 'OK', {duration: 3000});
      }
    }
  }
  paymentLimitByPaymentType(paymentType: AvailablePaymentMethods): Timestamp {
    const now = new Date();
    let secondsToAdd = 0;

    switch (paymentType) {
      case 'CASH':
        secondsToAdd = 43200; // 12 horas
        break;
      case 'CARD':
        secondsToAdd = 0; // no agrega tiempo
        break;
      case 'SPEI':
        secondsToAdd = this.speiPaymentTimeMinutes * 60;
        break;
      case 'DEFERRED':
        return this.selectedDeferredPlan?.payoffDate ?? Timestamp.fromDate(now);
      default:
        throw new Error('Invalid payment type');
    }

    const futureDate = new Date(now.getTime() + secondsToAdd * 1000);
    return Timestamp.fromDate(futureDate);
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
          //console.log("Payment Brick is ready");
        },
        onSubmit: ({}: any) => {},
        onError: (error: any) => {
          console.error(error);
        },
      },
    };
    window.paymentBrickController = await bricksBuilder.create(
      "payment",
      "paymentBrick_container",
      settings
    );
  }
  async confirmBooking(booking:FlightFirebaseBooking, isCard:boolean){
    const pendingPaymentUrl = booking.payment?.deferredPlan
      ? `https://xploratravel.com.mx/plan-pagos/${booking.bookingID!}`
      : `https://xploratravel.com.mx/reservar/realizar-pago/${booking.bookingID!}`;
    const personalizationData:PendingPaymentEmailData = {
      account_name: "Xplora Travel",
      service: "Transportación Aerea",
      pnr: this.uppercase.transform(booking.bookingID!.slice(-6)),
      locator: booking.created!.seconds.toString(),
      name: booking.contact!.name,
      year: this.datePipe.transform(new Date(), "yyyy")!,
      total: this.currency.transform(booking.payment!.totalDue, "MXN")!,
      status: this.getBookingStatusText(booking.status),
      whatsappURL: this.wa.getUrlFromTemplate('contactoDirecto'),
      bookingURL: "https://xploratravel.com.mx/confirmacion/"+booking.bookingID!,
      paymentURL: pendingPaymentUrl,
      receiptLink: "https://forms.gle/QwoGVQsU3sHwbhTz6",
    }
    const emailRequest = this.notifications.sendEmail({
      to: [
        {
          name: booking.contact!.name+" "+booking.contact!.lastname,
          email: booking.contact!.email
        }
      ],
      subject: "Confirmación de Reservación",
      from: {
        email: "no-reply@xploratravel.com.mx",
        name: "Xplora Travel"
      },
      template_id: isCard?"pq3enl66v1ml2vwr":"0r83ql3mxjmgzw1j",
      personalization: [
        {
          email: booking.contact!.email,
          data: personalizationData
        }
      ]
    });
    const confirmationTextSms = `¡Hola ${this.title.transform(booking.contact!.name)}! Tu reservación con Xplora Travel ha sido confirmada. PNR: ${this.uppercase.transform(booking.bookingID!.slice(-6))}. Puedes consultar los detalles en: https://xploratravel.com.mx/confirmacion/${booking.bookingID!} ¡Gracias por viajar con nosotros!`;
    const pendingTextSms = `¡Hola ${this.title.transform(booking.contact!.name)}! Tu reservación con Xplora Travel está pendiente de pago. PNR: ${this.uppercase.transform(booking.bookingID!.slice(-6))}. Consulta los siguientes pasos en: ${pendingPaymentUrl}`;
    const smsRequest = this.notifications.sendSms(
      "+" + booking.contact!.country_code + booking.contact!.phone,
      pendingTextSms
    );
    const adminNotificationSms = `Nueva reservación registrada. PNR: ${this.uppercase.transform(booking.bookingID!.slice(-6))}, Nombre: ${this.title.transform(booking.contact!.name)} ${this.title.transform(booking.contact!.lastname)}, Total: ${this.currency.transform(booking.payment!.totalDue, "MXN")}.`;
    const smsAdminRequest = this.notifications.sendSms(
      "+529983984239",
      adminNotificationSms
    )
    return [emailRequest, smsRequest, smsAdminRequest];
  }
  createPayment(){
    this.loading=true;
    window.paymentBrickController.getFormData().then((data:PaymentData)=>{
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
                    status: "CONFIRMED",
                    created: new Date()
                  }).subscribe(ok=>{
                    this.shared.setLoading(true);
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
            this.xplora.updateBooking(this.bookingID!, {
              charges: this.chargeResume,
              activePayment: payment,
              totalDue: this.total,
              paymentURL: payment.transaction_details.external_resource_url,
              status: "HOLD",
              created: new Date()
            }).subscribe(ok=>{
              this.shared.setLoading(true);
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
        this.xplora.updateBooking(this.bookingID!, {
          charges: this.chargeResume,
          activePayment: {
            payment_type_id: data.paymentType
          },
          totalDue: this.total,
          status: "HOLD"
        }).subscribe(ok=>{
          this.shared.setLoading(true);
        });
      }
    })
  }
  getOfficeMin(office: PaymentOffice): number {
    const min = Number(office?.minAmount ?? 0);
    return Number.isFinite(min) ? min : 0;
  }

  getOfficeMax(office: PaymentOffice): number | null {
    const max = office?.maxAmount;
    if (max === null || max === undefined) return null;
    const parsed = Number(max);
    return Number.isFinite(parsed) ? parsed : null;
  }

  isOfficeAvailable(office: PaymentOffice, amount: number): boolean {
    const min = this.getOfficeMin(office);
    const max = this.getOfficeMax(office);
    if (amount < min) return false;
    if (max !== null && amount > max) return false;
    return true;
  }

  isBelowOfficeMin(office: PaymentOffice, amount: number): boolean {
    return amount < this.getOfficeMin(office);
  }

  isAboveOfficeMax(office: PaymentOffice, amount: number): boolean {
    const max = this.getOfficeMax(office);
    return max !== null && amount > max;
  }

  paymentOfficeChange(event:MatSelectionListChange){
    if(event.options.length>0){
      this.selectedPaymentOffice = event.options[0].value;
      this.paymentOffices = this.allPaymentOffices.filter(office => office.id === this.selectedPaymentOffice);
    }
  }
  resetPaymentOffice(){
    this.paymentOffices = this.allPaymentOffices;
    this.list.deselectAll();
    this.selectedPaymentOffice = undefined;
  }
  openedPanel(activePayment:AvailablePaymentMethods){
    this.selectedPaymentMethod.emit(activePayment);
    this.selectedPayment = activePayment;
  }
  closedPanel(event:any){
    if(this.selectedPayment===event)this.selectedPayment = undefined;
  }

  get selectedDeferredPlan(): DeferredPaymentPlan | undefined {
    return this.deferredPlans.find(plan => plan.frequency === this.selectedDeferredFrequency);
  }

  get canConfirmDeferredPlan(): boolean {
    return this.deferredEligibility?.eligible === true
      && !!this.selectedDeferredPlan
      && this.acceptedDeferredTerms;
  }

  selectDeferredFrequency(frequency: DeferredPaymentFrequency): void {
    this.selectedDeferredFrequency = frequency;
  }

  getDeferredFrequencyLabel(frequency: DeferredPaymentFrequency): string {
    return this.deferredPaymentPlans.getFrequencyLabel(frequency);
  }

  openDeferredTerms(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.dialog.open(DeferredPaymentTermsDialogComponent, {
      width: '820px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });
  }

  private refreshDeferredPaymentPlans(): void {
    const departure = this.booking?.flightDetails?.departure?.toDate?.();
    this.deferredEligibility = this.deferredPaymentPlans.evaluateEligibility(this.total, departure);
    this.deferredPlans = [];
    this.selectedDeferredFrequency = undefined;
    this.acceptedDeferredTerms = false;

    if (!this.deferredEligibility.eligible || !departure) {
      return;
    }

    const requestedAt = new Date();
    const basePlanId = `deferred-preview-${this.bookingID ?? 'booking'}-${requestedAt.getTime()}`;
    this.deferredPlans = this.deferredEligibility.availableFrequencies.map(frequency =>
      this.deferredPaymentPlans.buildPlan({
        purchaseAmount: this.total,
        tripStartDate: departure,
        frequency,
        requestedAt,
        planId: `${basePlanId}-${frequency.toLowerCase()}`
      })
    );
    this.selectedDeferredFrequency = this.deferredPlans[0]?.frequency;
  }

  private createAcceptedDeferredPlan(): DeferredPaymentPlan | undefined {
    const departure = this.booking?.flightDetails?.departure?.toDate?.();
    const preview = this.selectedDeferredPlan;
    if (!departure || !preview || !this.acceptedDeferredTerms) {
      return undefined;
    }

    return this.deferredPaymentPlans.buildPlan({
      purchaseAmount: this.total,
      tripStartDate: departure,
      frequency: preview.frequency,
      requestedAt: new Date(),
      planId: preview.id,
      termsAccepted: true
    });
  }
}

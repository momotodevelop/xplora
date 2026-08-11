import { Component, CSP_NONCE, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CardFieldsOnApproveData, loadScript, PayPalCardFieldsComponent, PayPalNamespace } from "@paypal/paypal-js";
import { PayPalService } from '../../../../services/paypal.service';
import { debounceTime, firstValueFrom } from 'rxjs';
import { FirebaseBooking, PayPalPaymentData } from '../../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { WORLD_COUNTRIES } from '../../../../static/countries.static';
import { CodigoPostalInfo, CopomexService } from '../../../../services/copomex.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PaymentErrorService } from '../../../../services/payment-error.service';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { TestMode, PayPalClientId } from '../../../../../environments/environment'
import { SiteIdentityService } from '../../../../services/site-identity.service';

@Component({
  selector: 'app-paypal-payment',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatSelectModule, MatSnackBarModule],
  templateUrl: './paypal-payment.component.html',
  styleUrl: './paypal-payment.component.scss'
})
export class PaypalPaymentComponent implements OnInit {
  readonly site = this.siteIdentity.config;

  constructor(
    private pp: PayPalService,
    private copomex: CopomexService,
    private sb: MatSnackBar,
    private errorsResponse: PaymentErrorService,
    private firebase: FireBookingService,
    private siteIdentity: SiteIdentityService
  ){}
  paypal:any;
  cardFields?:PayPalCardFieldsComponent;
  private nonce = inject(CSP_NONCE, { optional: true });
  countries = WORLD_COUNTRIES;
  zipcode_info?: CodigoPostalInfo;
  loading:boolean=false;
  @Input() booking!: FirebaseBooking;
  @ViewChild('cvvContainer', { static: true }) cvvContainer!: ElementRef;
  @ViewChild('nameContainer', { static: true }) nameContainer!: ElementRef;
  @ViewChild('numberContainer', { static: true }) numberContainer!: ElementRef;
  @ViewChild('expiryContainer', { static: true }) expiryContainer!: ElementRef;
  @Output() paymentProcessed: EventEmitter<void> = new EventEmitter();
  @Output() paymentFailed: EventEmitter<string> = new EventEmitter();
  @Output() disabledByFraudPrevention: EventEmitter<void> = new EventEmitter();
  zipcode = new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(9)]);
  country = new FormControl('MX', [Validators.required]);
  addressLine1 = new FormControl('', [Validators.required, Validators.minLength(3)]);
  addressLine2 = new FormControl('');
  city = new FormControl({ value: '', disabled: true }, [Validators.required]);
  neighborhood = new FormControl({ value: '', disabled: true }, [Validators.required]);
  formGroup = new FormGroup({
    zipcode: this.zipcode,
    country: this.country,
    addressLine1: this.addressLine1,
    addressLine2: this.addressLine2,
    city: this.city,
    neighborhood: this.neighborhood
  });
  neighborhoods: string[] = [];
  ngOnInit(): void {
    console.log(this.cvvContainer);
    console.log(this.nameContainer);
    console.log(this.numberContainer);
    console.log(this.expiryContainer);
    this.firebase.getPayPalPaymentsByBooking(this.booking.bookingID!).then(payments=>{
      console.log("Pagos PayPal de la reserva:", payments);
      const hasFraudPayments:boolean = payments.some(payment => payment.statusMessage?.category === 'fraud');
      const noRetry:boolean = payments.some(payment => payment.statusMessage?.retryable === false);
      const approvedPayment = payments.find(payment => payment.statusMessage?.category === 'approved');
      if(approvedPayment){
        this.sb.open("Esta reserva ya cuenta con un pago aprobado mediante PayPal.","Cerrar",{duration: 8000});
        this.paymentProcessed.emit();
      }else if(hasFraudPayments){
        this.disabledByFraudPrevention.emit();
      }else if(noRetry){
        this.sb.open("Se han detectado errores no recuperables en los pagos de esta reserva. No es posible procesar más pagos mediante PayPal.","Cerrar",{duration: 7000});
        this.disabledByFraudPrevention.emit();
      }
    });
    this.paypal = loadScript({ 
      clientId: PayPalClientId,
      components: ['card-fields'],
      dataCspNonce: this.nonce!
    });
    this.paypal.then((paypal:PayPalNamespace) => {
      console.log(paypal.CardFields);
      if (paypal.CardFields) {
        const cardFields = paypal.CardFields({
          createOrder: () => {
            //Esto se ejecuta cuando el cliente hace click en pagar y la validacion de los datos de pago es correcta
            console.log("Creando orden...");
            return this.createOrder();
          },
          onApprove: (data: CardFieldsOnApproveData) => {
            //Esto se ejecuta cuando se crea la orden correctamente
            //Entonces se hace la captura de la orden
            console.log("Capturando:", data.orderID);
            return this.captureOrder(data.orderID);
          },
          onError: (err: Record<string, unknown>) =>{
            console.error("Error in CardFields", err);
          },
        });
        if(cardFields?.isEligible()){
          const cvvFieldCardFields = cardFields.CVVField({placeholder: 'CVV'});
          const nameFieldCardFields = cardFields.NameField({placeholder: 'Nombre en la tarjeta'});
          const numberFieldCardFields = cardFields.NumberField({placeholder: 'Número de tarjeta'});
          const expiryFieldCardFields = cardFields.ExpiryField({placeholder: 'MM/AA'});
          cvvFieldCardFields.render(this.cvvContainer.nativeElement);
          nameFieldCardFields.render(this.nameContainer.nativeElement);
          numberFieldCardFields.render(this.numberContainer.nativeElement);
          expiryFieldCardFields.render(this.expiryContainer.nativeElement);
        }
        this.cardFields = cardFields;
      } else {
        console.error("CardFields or CVVField is undefined");
      }
    }).catch((err:any) => {
      console.error("failed to load the PayPal JS SDK script", err);
    });
    this.country.valueChanges.subscribe(countryCode=>{
      console.log("Country changed to:", countryCode);
      if(countryCode==='MX'){
        this.city.disable();
      }else{
        this.neighborhood.enable();
        this.city.enable();
      }
      this.zipcode.setValue(null);
      this.city.setValue(null);
      this.neighborhood.setValue(null);
      this.neighborhoods = [];
      // Aquí puedes agregar lógica para actualizar los campos de ciudad y estado según el país seleccionado
    });
    this.zipcode.valueChanges.pipe(debounceTime(500)).subscribe(zipcode=>{
      console.log("Zipcode changed to:", zipcode);
      if(zipcode&&zipcode.length>2){
        if(this.zipcode.valid){
          this.neighborhood.enable();
          if(this.country.valid){
            if(this.country.value==='MX'){
              this.copomex.getInfoCodigoPostal(zipcode!).subscribe(info=>{
                this.zipcode_info = info;
                if(!info.error&&info.response){
                  this.city.setValue(info.response.ciudad);
                  this.neighborhoods = info.response.asentamiento;
                }else{
                  this.neighborhoods = [];
                }
              }, (error:HttpErrorResponse)=>{
                console.error("Error processing zipcode change:", error.error.error_message);
                this.neighborhoods = [];
                this.city.enable();
                this.city.reset();
                this.neighborhood.enable();
                this.neighborhood.reset();
                if(error.error.error_code==="102"||error.error.error_code==="103"){
                  this.sb.open("Código postal no encontrado","Cerrar",{duration: 5000});
                }else{
                  this.sb.open("Error al buscar el código postal","Cerrar",{duration: 5000});
                }
              });
            }
          }
        }else{
          this.city.disable();
          this.city.reset();
          this.neighborhood.disable();
          this.neighborhood.reset();
          this.neighborhoods = [];
        }
      }
      // Aquí puedes agregar lógica para autocompletar ciudad y estado basado en el código postal
    });
  }
  async createOrder(): Promise<string> {
    this.loading=true;
    try {
      const order = await firstValueFrom(
        this.pp.createOrder(
          this.booking.payment!.totalDue,
          'MXN',
          'https://xploratravel.com.mx/confirmacion/'+this.booking.bookingID!,
          'https://xploratravel.com.mx/reservar/realizar-pago/'+this.booking.bookingID!,
          TestMode // Modo de prueba (sandbox)
        )
      );
      console.log('Orden creada en PayPal:', order);
      const orderId = order?.id ?? ''; // Ajusta según la estructura real
      console.log('Order ID:', orderId);
      return orderId;

    } catch (error: any) {
      this.loading=false;
      console.error('Error al crear la orden en PayPal:', error);
      // Puedes lanzar el error o devolver algo controlado
      throw new Error(error?.message || 'No se pudo crear la orden');
    }
  }
  processPayment(){
    this.cardFields?.submit().then((data:any) => {
      console.log("Payment data:", data);
    }).catch((err:any) => {
      this.loading=false;
      console.error("Error submitting payment:", err);
      if(err==='INVALID_NUMBER'){
        this.sb.open("El número de tarjeta es inválido","Cerrar",{duration: 5000});
      }
      if(err==='INVALID_CVV'){
        this.sb.open("El código CVV es inválido","Cerrar",{duration: 5000});
      }
      if(err==='INVALID_EXPIRY'){
        this.sb.open("La fecha de expiración es inválida","Cerrar",{duration: 5000});
      }
    });
  }
  
  captureOrder(orderId:string){
    this.pp.captureOrder(orderId, TestMode).subscribe({
      next: (order) => {
        console.log('Orden capturada en PayPal:', order);
        console.log(order.purchase_units[0].payments?.captures![0].processor_response?.response_code);
        const result = this.errorsResponse.buildErrorMessage(order.purchase_units[0].payments?.captures![0].processor_response!);
        const promises:Promise<FirebaseBooking|PayPalPaymentData[]>[] = [
          this.firebase.addPayPalPaymentToBooking(this.booking.bookingID!, {
            method: 'PAYPAL',
            address: {
              line1: this.addressLine1.value!,
              line2: this.addressLine2.value!,
              city: this.city.value!,
              neighborhood: this.neighborhood.value!,
              country_code: this.country.value!,
              postal_code: this.zipcode.value!,
              postal_code_info: this.zipcode_info ? this.replaceUndefinedWithNull(this.zipcode_info) : null,
            },
            response: this.replaceUndefinedWithNull(order),
            timestamp: new Date(),
            statusMessage: this.replaceUndefinedWithNull(result)
          })
        ]
        if(result.category==='approved'){
          promises.push(this.firebase.updateBooking(this.booking.bookingID!, {status: 'VALIDATING'}));
        }
        Promise.all(promises).then((response)=>{
          const payments = response[0] as PayPalPaymentData[];
          if(response.length>1){
            const updatedBooking = response[1] as FirebaseBooking;
          }
          this.loading=false;
          if(result.category==='approved'){
            this.sb.open("Pago procesado correctamente.","Cerrar",{duration: 4000});
            this.paymentProcessed.emit();
          }else if(result.category==='fraud'){
            this.sb.open("El pago ha sido rechazado por prevención de fraude.","Cerrar",{duration: 4000});
            this.disabledByFraudPrevention.emit();
          }else{
            this.sb.open(result.message,"Cerrar",{duration: 4000});
          }
        });
      },
      error: (error) => {
        this.formGroup.reset();
        this.sb.open("Ha ocurrido un error al procesar el pago","Cerrar",{duration: 3000});
        console.error('Error al capturar la orden en PayPal:', error);
      }
    });
  }

  replaceUndefinedWithNull(obj:any): any {
    if (obj === null || typeof obj !== 'object') return obj;

    // Si es arreglo, lo procesamos elemento por elemento
    if (Array.isArray(obj)) {
      return obj.map(value => 
        value === undefined ? null : this.replaceUndefinedWithNull(value)
      );
    }

    // Si es objeto normal
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (value === undefined) return [key, null];
        if (typeof value === 'object') return [key, this.replaceUndefinedWithNull(value)];
        return [key, value];
      })
    );
  }

}

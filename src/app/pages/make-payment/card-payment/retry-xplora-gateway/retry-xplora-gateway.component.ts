import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { FirebaseBooking } from '../../../../types/booking.types';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCreditCard, faExclamationTriangle, faInfoCircle, faPlaneCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { XploraCardServicesService } from '../../../../services/xplora-card-services.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { FlowRedirectPaymentComponent } from '../flow-redirect-payment/flow-redirect-payment.component';

export interface PaymentOption {
  id: string;           // Identificador único: 'RETRY' | 'CASH' | 'SPEI'
  title: string;        // Título corto y claro
  descripcion: string;  // Descripción principal de la opción
  note?: string;        // Nota aclaratoria o detalle adicional
  discount?: Discount;  // Información sobre descuentos aplicables
}

export interface Discount {
  value: number;        // Valor numérico del descuento (ej. 10 = 10%)
  descripcion: string;  // Texto explicando el beneficio
}

@Component({
  selector: 'app-retry-xplora-gateway',
  imports: [MatCheckboxModule, ReactiveFormsModule, FormsModule, CommonModule, FontAwesomeModule, MatButtonModule, FlowRedirectPaymentComponent],
  templateUrl: './retry-xplora-gateway.component.html',
  styleUrl: './retry-xplora-gateway.component.scss'
})
export class RetryXploraGatewayComponent implements OnInit, OnChanges {
  @Input() booking!: FirebaseBooking;
  @Input() disabledByFraudPrevention:boolean = false;
  selectedOption: FormControl<'RETRY' | 'CASH' | 'SPEI' | null> = new FormControl(null, [Validators.required]);
  infoIcon = faInfoCircle;
  cardIcon = faCreditCard;
  planeConfirmIcon = faPlaneCircleCheck;
  disabledCardPayment:boolean = false;
  ngOnInit() {
    this.cards.getPaymentsByBooking(this.booking.bookingID!).subscribe(payments=>{
      if(!this.disabledByFraudPrevention){
        this.disabledCardPayment = payments.length>2;
      }
    });
    this.disabledCardPayment = this.disabledByFraudPrevention;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['disabledByFraudPrevention']){
      this.disabledCardPayment = changes['disabledByFraudPrevention'].currentValue;
    }
  }
  madePaymentMode = false;
  constructor(
    private bookings: FireBookingService,
    private cards: XploraCardServicesService,
    private sb: MatSnackBar,
    private router: Router
  ){

  }
  updatePaymentMethod(){
    if(!this.selectedOption.value) return;
    const method = this.selectedOption.value;
    const discountApplyed = method === 'CASH' ? 10 : method === 'SPEI' ? 15 : 0;
    if(method === 'RETRY'){
      if(this.disabledCardPayment){
        this.sb.open('Por motivos de seguridad, este método de pago ha sido desactivado. Por favor, seleccione otro método.', 'Cerrar', {
          duration: 5000,
        });
      }else{
        this.madePaymentMode = true;
      }
    }else{
      if(method !== this.booking.payment!.method){
        const hours = method === 'CASH' ? 12 : method === 'SPEI' ? 1 : 2;
        this.bookings.updateBooking(this.booking.bookingID!, {
        payment: {
          ...this.booking.payment!,
          method: method,
          totalDue: this.booking.payment!.originalAmount * (1 - (discountApplyed / 100)),
          paymentLimit: new Timestamp(Math.floor((Date.now() + (hours*(60 * 60 * 1000))) / 1000), 0), // 1 hora para completar el pago
        }
      }).then(()=>{
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => this.router.navigateByUrl('/reservar/realizar-pago/' + this.booking.bookingID));
      });
      }
    }
  }
  getDiscountedAmount(discount: number){
    return this.booking.payment!.amount * (1 - (discount / 100));
  }
  getCardClasses(optionId: string) {
    return {
      'selected': this.selectedOption?.value === optionId
    };
  }
  setSelectedOption(optionId: 'RETRY' | 'CASH' | 'SPEI') {
    if(optionId === 'RETRY' && this.disabledCardPayment){
      this.sb.open('Por motivos de seguridad, este método de pago ha sido desactivado. Por favor, seleccione otro método.', 'Cerrar', {
        duration: 5000,
      });
    }else{
      this.selectedOption.setValue(optionId);
    };
  }
}

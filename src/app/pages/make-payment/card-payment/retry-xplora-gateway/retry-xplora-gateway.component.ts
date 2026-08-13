import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { FirebaseBooking } from '../../../../types/booking.types';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCreditCard, faInfoCircle, faPlaneCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { MatButtonModule } from '@angular/material/button';
import { MAX_CARD_PAYMENT_ATTEMPTS, XploraCardServicesService } from '../../../../services/xplora-card-services.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Timestamp } from 'firebase/firestore';
import { XploraGatewayComponent } from '../../../../shared/xplora-gateway/xplora-gateway.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule, MatButtonModule, XploraGatewayComponent],
  templateUrl: './retry-xplora-gateway.component.html',
  styleUrl: './retry-xplora-gateway.component.scss'
})
export class RetryXploraGatewayComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  @Input() disabledByFraudPrevention:boolean = false;
  selectedOption: FormControl<'RETRY' | 'CASH' | 'SPEI' | null> = new FormControl(null, [Validators.required]);
  infoIcon = faInfoCircle;
  cardIcon = faCreditCard;
  planeConfirmIcon = faPlaneCircleCheck;
  cardAttemptCount = 0;
  attemptsLoading = true;
  cardAttemptsUnavailable = false;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.cards.getCardAttemptCount(this.booking.bookingID!).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: attemptCount=>{
        this.cardAttemptCount = attemptCount;
        this.attemptsLoading = false;
        if (this.disabledCardPayment && this.selectedOption.value === 'RETRY') {
          this.selectedOption.reset();
        }
      },
      error: error => {
        console.error('No fue posible consultar los intentos de pago:', error);
        this.attemptsLoading = false;
        this.cardAttemptsUnavailable = true;
      }
    });
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
        this.notifyCardUnavailable();
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
  get pendingCardAmount(): number {
    return Math.max(
      Number(this.booking.payment?.totalDue ?? 0) - Number(this.booking.payment?.payed ?? 0),
      0
    );
  }
  get disabledCardPayment(): boolean {
    return this.attemptsLoading
      || this.cardAttemptsUnavailable
      || this.disabledByFraudPrevention
      || this.cardAttemptCount >= MAX_CARD_PAYMENT_ATTEMPTS;
  }
  get retryLimitReached(): boolean {
    return this.cardAttemptCount >= MAX_CARD_PAYMENT_ATTEMPTS;
  }
  get remainingCardRetries(): number {
    return Math.max(MAX_CARD_PAYMENT_ATTEMPTS - this.cardAttemptCount, 0);
  }
  getCardClasses(optionId: string) {
    return {
      'selected': this.selectedOption?.value === optionId,
      'option-card--disabled': optionId === 'RETRY' && this.disabledCardPayment
    };
  }
  setSelectedOption(optionId: 'RETRY' | 'CASH' | 'SPEI') {
    if(optionId === 'RETRY' && this.disabledCardPayment){
      this.notifyCardUnavailable();
    }else{
      this.selectedOption.setValue(optionId);
    };
  }

  handleRejectedAttempt(): void {
    this.madePaymentMode = false;
    this.selectedOption.reset();
  }

  handleAttemptLimitReached(): void {
    this.cardAttemptCount = MAX_CARD_PAYMENT_ATTEMPTS;
    this.handleRejectedAttempt();
  }

  private notifyCardUnavailable(): void {
    const message = this.attemptsLoading
      ? 'Estamos verificando la disponibilidad del pago con tarjeta. Inténtalo nuevamente en un momento.'
      : this.retryLimitReached
      ? 'Se superó el límite máximo de intentos con tarjeta. Selecciona transferencia o pago en sucursal.'
      : 'Este método de pago no está disponible. Selecciona otra opción para completar tu reservación.';
    this.sb.open(message, 'Cerrar', { duration: 6000 });
  }
}

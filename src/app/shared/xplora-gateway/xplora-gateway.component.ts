import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, firstValueFrom, Subject, take, takeUntil } from 'rxjs';
import { CreditCardDirectivesModule, CreditCardFormatDirective, CreditCardValidators } from '../credit-card/credit-card-library';
import { FirebaseBooking } from '../../types/booking.types';
import { PaymentDetails, ClipSDKService } from '../../services/clip-sdk.service';
import { Installment } from '../../types/installments.clip.type';
import { WORLD_COUNTRIES } from '../../static/countries.static';
import {
  CardBillingAddress,
  CardPaymentAttemptType,
  CardType,
  MAX_CARD_PAYMENT_ATTEMPTS,
  StoredCardPaymentData,
  XploraCardServicesService
} from '../../services/xplora-card-services.service';
import { SiteIdentityService } from '../../services/site-identity.service';

export class XploraGatewayValidationError extends Error {
  constructor() {
    super('XPLORA_GATEWAY_INVALID');
  }
}

export class XploraGatewayAttemptLimitError extends Error {
  constructor() {
    super('XPLORA_GATEWAY_ATTEMPT_LIMIT');
  }
}

@Component({
  selector: 'app-xplora-gateway',
  imports: [
    CommonModule,
    CreditCardDirectivesModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatSelectModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './xplora-gateway.component.html',
  styleUrl: './xplora-gateway.component.scss'
})
export class XploraGatewayComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() booking!: FirebaseBooking;
  @Input() amount = 0;
  @Input() attemptType: CardPaymentAttemptType = 'INITIAL';
  @Input() showSubmitButton = false;
  @Input() disabled = false;
  @Output() validityChange = new EventEmitter<boolean>();
  @Output() paymentRejected = new EventEmitter<StoredCardPaymentData>();
  @Output() attemptLimitReached = new EventEmitter<void>();
  @ViewChild('ccNumber') private ccNumber?: CreditCardFormatDirective;

  readonly countries = WORLD_COUNTRIES;
  readonly site = this.siteIdentity.config;
  private readonly destroyed$ = new Subject<void>();
  private lastValidity?: boolean;

  availableInstallments: Installment[] = [];
  saving = false;

  readonly cardForm = new FormGroup({
    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, CreditCardValidators.validateCCNumber]
    }),
    type: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    expiration: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, CreditCardValidators.validateExpDate]
    }),
    cvv: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(4)]
    }),
    holder: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    installments: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] })
  });

  readonly addressForm = new FormGroup({
    countryCode: new FormControl('MX', { nonNullable: true, validators: [Validators.required] }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]{3,10}$/)]
    }),
    line1: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)]
    }),
    line2: new FormControl('', { nonNullable: true }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    state: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    neighborhood: new FormControl('', { nonNullable: true })
  });

  constructor(
    private readonly clip: ClipSDKService,
    private readonly cards: XploraCardServicesService,
    private readonly snackBar: MatSnackBar,
    private readonly siteIdentity: SiteIdentityService
  ) {}

  ngAfterViewInit(): void {
    this.cardForm.controls.number.valueChanges.pipe(
      debounceTime(350),
      takeUntil(this.destroyed$)
    ).subscribe(number => this.handleCardNumberChange(number));

    this.cardForm.statusChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => this.emitValidity());
    this.addressForm.statusChanges.pipe(takeUntil(this.destroyed$)).subscribe(() => this.emitValidity());
    this.emitValidity();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amount'] && !changes['amount'].firstChange && this.cardForm.controls.number.valid) {
      this.loadInstallments(this.cardForm.controls.number.value);
    }

    if (changes['disabled']) {
      if (this.disabled) {
        this.cardForm.disable({ emitEvent: false });
        this.addressForm.disable({ emitEvent: false });
      } else {
        this.cardForm.enable({ emitEvent: false });
        this.addressForm.enable({ emitEvent: false });
      }
      this.emitValidity();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  get pendingAmount(): number {
    if (this.amount > 0) {
      return this.amount;
    }
    const total = Number(this.booking?.payment?.totalDue ?? 0);
    const payed = Number(this.booking?.payment?.payed ?? 0);
    return Math.max(total - payed, 0);
  }

  get isCardComplete(): boolean {
    return this.cardForm.valid;
  }

  get isComplete(): boolean {
    return !this.disabled && this.cardForm.valid && this.addressForm.valid;
  }

  get paymentDetails(): PaymentDetails {
    const value = this.cardForm.getRawValue();
    return {
      number: value.number,
      type: value.type as CardType,
      expiration: value.expiration,
      cvv: value.cvv,
      holder: value.holder.trim(),
      installments: value.installments
    };
  }

  get billingAddress(): CardBillingAddress {
    const value = this.addressForm.getRawValue();
    return {
      countryCode: value.countryCode,
      postalCode: value.postalCode.trim(),
      line1: value.line1.trim(),
      ...(value.line2.trim() ? { line2: value.line2.trim() } : {}),
      city: value.city.trim(),
      state: value.state.trim(),
      ...(value.neighborhood.trim() ? { neighborhood: value.neighborhood.trim() } : {})
    };
  }

  markAllAsTouched(): void {
    this.cardForm.markAllAsTouched();
    if (this.cardForm.valid) {
      this.addressForm.markAllAsTouched();
    }
  }

  installmentsChange(event: MatSelectionListChange): void {
    const selected = event.options[0]?.value;
    if (selected) {
      this.cardForm.controls.installments.setValue(selected);
    }
  }

  async savePayment(): Promise<StoredCardPaymentData> {
    this.markAllAsTouched();
    if (!this.booking?.bookingID || !this.isComplete || this.pendingAmount <= 0) {
      throw new XploraGatewayValidationError();
    }

    const previousAttemptCount = await firstValueFrom(
      this.cards.getCardAttemptCount(this.booking.bookingID).pipe(take(1))
    );
    const attemptNumber = previousAttemptCount + 1;
    const attemptLimit = this.attemptType === 'INITIAL' ? 1 : MAX_CARD_PAYMENT_ATTEMPTS;

    if (attemptNumber > attemptLimit) {
      throw new XploraGatewayAttemptLimitError();
    }

    const paymentData: StoredCardPaymentData = {
      bookingId: this.booking.bookingID,
      ...this.paymentDetails,
      billingAddress: this.billingAddress,
      amount: this.pendingAmount,
      createdAt: new Date(),
      status: 'failed',
      attemptNumber,
      attemptType: this.attemptType
    };
    const id = await this.cards.addPayment(this.booking.bookingID, paymentData);
    return { ...paymentData, id };
  }

  async processPayment(): Promise<void> {
    if (this.saving || this.disabled) {
      return;
    }

    this.saving = true;
    try {
      const payment = await this.savePayment();
      this.snackBar.open(
        'La transacción fue rechazada. Verifica los datos o intenta con otra tarjeta.',
        'Cerrar',
        { duration: 5000 }
      );
      this.paymentRejected.emit(payment);
    } catch (error) {
      if (error instanceof XploraGatewayAttemptLimitError) {
        this.snackBar.open(
          'Se superó el límite máximo de intentos con tarjeta. Selecciona transferencia o pago en sucursal.',
          'Cerrar',
          { duration: 6000 }
        );
        this.attemptLimitReached.emit();
      } else if (error instanceof XploraGatewayValidationError) {
        this.snackBar.open(
          'Completa correctamente los datos de la tarjeta y la dirección de facturación.',
          'Cerrar',
          { duration: 4000 }
        );
      } else {
        console.error('No fue posible registrar el intento de pago:', error);
        this.snackBar.open(
          'No fue posible procesar la información de pago. Inténtalo nuevamente.',
          'Cerrar',
          { duration: 4000 }
        );
      }
    } finally {
      this.saving = false;
    }
  }

  private handleCardNumberChange(number: string): void {
    const scheme = this.ccNumber?.resolvedScheme$.value ?? '';
    this.cardForm.controls.type.setValue(scheme);

    if (!this.cardForm.controls.number.valid || !scheme) {
      this.availableInstallments = [];
      this.cardForm.controls.installments.setValue(1);
      return;
    }

    this.loadInstallments(number);
  }

  private loadInstallments(number: string): void {
    const scheme = this.ccNumber?.resolvedScheme$.value.toLowerCase();
    const type = scheme === 'mastercard' ? 'master' : scheme;
    const bin = number.replace(/\s/g, '').slice(0, 6);

    if (!bin || !type || !['visa', 'master', 'amex'].includes(type) || this.pendingAmount <= 0) {
      this.availableInstallments = [];
      this.cardForm.controls.installments.setValue(1);
      return;
    }

    this.clip.getInstallments(this.pendingAmount, bin, type as 'visa' | 'master' | 'amex').pipe(
      take(1),
      takeUntil(this.destroyed$)
    ).subscribe({
      next: installments => {
        const firstOption = installments[0];
        this.availableInstallments = firstOption?.installments
          ? this.clip.createInstallments(firstOption.installments, this.pendingAmount).filter(option => option.quantity > 1)
          : [];
        this.cardForm.controls.installments.setValue(1);
      },
      error: () => {
        this.availableInstallments = [];
        this.cardForm.controls.installments.setValue(1);
      }
    });
  }

  private emitValidity(): void {
    const currentValidity = this.isComplete;
    if (this.lastValidity !== currentValidity) {
      this.lastValidity = currentValidity;
      this.validityChange.emit(currentValidity);
    }
  }
}

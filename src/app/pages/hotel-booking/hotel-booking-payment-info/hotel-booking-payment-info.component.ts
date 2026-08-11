import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CreditCardDirectivesModule, CreditCardFormatDirective, CreditCardValidators } from '../../../shared/credit-card/credit-card-library';
import { ClipSDKService } from '../../../services/clip-sdk.service';
import { Installment } from '../../../types/installments.clip.type';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  DeferredPaymentFrequency,
  DeferredPaymentPlan
} from '../../../types/booking.types';
import {
  DeferredPaymentEligibility,
  DeferredPaymentPlanService
} from '../../../services/deferred-payment-plan.service';
import { DeferredPaymentTermsDialogComponent } from '../../booking-process/payment/deferred-payment-terms-dialog.component';
import { Timestamp } from '@angular/fire/firestore';
import { DEFAULT_PAYMENT_CONFIG } from '../../../types/payment-config.types';

export interface PaymentCardData{
  number: string,
  expiration: string,
  cvv: string,
  holderName: string,
  holderLastName: string,
  installments: number,
  brand: "visa"|"mastercard"|"amex"|string
}

@Component({
  selector: 'app-hotel-booking-payment-info',
  imports: [
    FormsModule,
    CommonModule,
    MatRadioModule, 
    MatTabsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    CreditCardDirectivesModule, 
    ReactiveFormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './hotel-booking-payment-info.component.html',
  styleUrl: './hotel-booking-payment-info.component.scss'
})
export class HotelBookingPaymentInfoComponent implements OnInit, OnChanges {
  paymentTypeSelected:"NOW"|"DELAYED"="NOW";
  selectedPaymentMethod:"CARD"|"CASH"|"SPEI"|"DEFERRED"="CARD";
  @ViewChild('ccNumber') ccNumber!: CreditCardFormatDirective;
  @ViewChild('paymentMethodTabs') paymentMethodTabs!: MatTabGroup;
  @Input() amount!:number;
  @Input() tripStartDate?: Date;
  @Input() bookingId?: string;
  @Input() speiPaymentTimeMinutes = DEFAULT_PAYMENT_CONFIG.speiPaymentTimeMinutes;
  @Output() paymentType:EventEmitter<"NOW"|"DELAYED"> = new EventEmitter();
  @Output() paymentMethod:EventEmitter<"CARD"|"CASH"|"SPEI"|"DEFERRED"> = new EventEmitter();
  @Output() cardData:EventEmitter<PaymentCardData> = new EventEmitter();
  @Output() deferredPlan: EventEmitter<DeferredPaymentPlan | undefined> = new EventEmitter();
  ccForm:FormGroup = new FormGroup({
    number: new FormControl('', [Validators.required, CreditCardValidators.validateCCNumber]),
    expiration: new FormControl('', [Validators.required, CreditCardValidators.validateExpDate]),
    cvv: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    holderName: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]+$')]),
    holderLastName: new FormControl('', [Validators.required, Validators.pattern('^[a-zA-Z ]+$')]),
    installments: new FormControl(1)
  });
  installments?: Installment[];
  selectedInstallment:Installment = {
    quantity: 1,
    fee: 0,
    amount: this.amount,
    total_amount: this.amount
  };
  deferredEligibility?: DeferredPaymentEligibility;
  deferredPlans: DeferredPaymentPlan[] = [];
  selectedDeferredFrequency?: DeferredPaymentFrequency;
  acceptedDeferredTerms = false;

  constructor(
    private clip: ClipSDKService,
    private deferredPaymentPlans: DeferredPaymentPlanService,
    private dialog: MatDialog
  ) { }
  get cardNumberInput():AbstractControl{
    return this.ccForm.controls['number'];
  }
  get installmentsInput(){
    return this.ccForm.controls['installments'];
  }
  ngOnInit(): void {
    this.cardNumberInput.valueChanges.subscribe(value=>{
      if(this.cardNumberInput.valid){
        const scheme = this.ccNumber.resolvedScheme$.value;
        const bin = value.replace(/\s/g, "").slice(0,6);
        const type = ['visa', 'mastercard', 'amex'].includes(scheme.toLowerCase()) ? scheme.toLowerCase() === 'mastercard' ? 'master' : scheme.toLowerCase() : undefined;
        if(bin&&type){
          this.clip.getInstallments(this.amount, bin, (type as 'visa'|'master'|'amex')).subscribe(i=>{
            if(i.length>0){
              const installments = i[0].installments;
              this.installments=installments.map(installment=>{
                const amount = Math.ceil(this.amount/installment.quantity);
                return {
                  ...installment,
                  amount,
                  fee: 0,
                  total_amount: amount*installment.quantity
                }
              });
            }
          });
        }
      }
    });
    this.installmentsInput.valueChanges.subscribe(value=>{
      if(value){
        this.selectedInstallment = this.installments!.find(inst=>inst.quantity===value)!;
      }
    });
    this.ccForm.valueChanges.subscribe((value:PaymentCardData)=>{
      if(this.ccForm.valid){
        this.cardData.emit({
          ...value,
          brand:this.ccNumber.resolvedScheme$.value
        });
      }else{
        this.cardData.emit(undefined);
      }
    });
    this.paymentType.emit(this.paymentTypeSelected);
    this.refreshDeferredPaymentPlans();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['amount'] || changes['tripStartDate'] || changes['bookingId']) {
      this.refreshDeferredPaymentPlans();
    }
  }
  changePaymentType(){
    if (this.paymentTypeSelected === 'DELAYED') {
      this.selectedPaymentMethod = 'CARD';
      if (this.paymentMethodTabs) {
        this.paymentMethodTabs.selectedIndex = 0;
      }
      this.paymentMethod.emit('CARD');
      this.deferredPlan.emit(undefined);
    }
    this.paymentType.emit(this.paymentTypeSelected);
  }
  changePaymentMethod(tab:MatTabChangeEvent){
    //console.log(tab);
    switch(tab.index){
      case 0:
        this.selectedPaymentMethod = 'CARD';
        this.paymentMethod.emit("CARD");
        break;
      case 1:
        this.selectedPaymentMethod = 'SPEI';
        this.paymentMethod.emit("SPEI");
        break;
      case 2:
        this.selectedPaymentMethod = 'CASH';
        this.paymentMethod.emit("CASH");
        break;
      case 3:
        this.selectedPaymentMethod = 'DEFERRED';
        this.paymentMethod.emit("DEFERRED");
        this.emitDeferredPlan();
        break;
    }
  }

  selectDeferredFrequency(frequency: DeferredPaymentFrequency): void {
    this.selectedDeferredFrequency = frequency;
    this.emitDeferredPlan();
  }

  deferredTermsChanged(): void {
    this.emitDeferredPlan();
  }

  getDeferredFrequencyLabel(frequency: DeferredPaymentFrequency): string {
    return this.deferredPaymentPlans.getFrequencyLabel(frequency);
  }

  openDeferredTerms(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dialog.open(DeferredPaymentTermsDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: false
    });
  }

  private refreshDeferredPaymentPlans(): void {
    this.deferredEligibility = this.deferredPaymentPlans.evaluateEligibility(
      this.amount,
      this.tripStartDate
    );
    this.deferredPlans = [];
    this.selectedDeferredFrequency = undefined;
    this.acceptedDeferredTerms = false;
    this.deferredPlan.emit(undefined);

    if (!this.deferredEligibility.eligible || !this.tripStartDate) {
      return;
    }

    const requestedAt = new Date();
    const basePlanId = `deferred-preview-${this.bookingId ?? 'hotel'}-${requestedAt.getTime()}`;
    this.deferredPlans = this.deferredEligibility.availableFrequencies.map(frequency =>
      this.deferredPaymentPlans.buildPlan({
        purchaseAmount: this.amount,
        tripStartDate: this.tripStartDate!,
        frequency,
        requestedAt,
        planId: `${basePlanId}-${frequency.toLowerCase()}`
      })
    );
    this.selectedDeferredFrequency = this.deferredPlans[0]?.frequency;
  }

  private emitDeferredPlan(): void {
    const selectedPlan = this.deferredPlans.find(
      plan => plan.frequency === this.selectedDeferredFrequency
    );
    if (!selectedPlan || !this.acceptedDeferredTerms) {
      this.deferredPlan.emit(undefined);
      return;
    }

    this.deferredPlan.emit({
      ...selectedPlan,
      termsAccepted: true,
      termsAcceptedAt: Timestamp.now()
    });
  }
}

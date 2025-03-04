import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { CreditCardDirectivesModule, CreditCardFormatDirective, CreditCardValidators } from 'angular-cc-library';
import { ClipSDKService } from '../../../services/clip-sdk.service';
import { Installment } from '../../../types/installments.clip.type';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';

export interface PaymentCardData{
  number: string,
  expiration: string,
  cvv: string,
  holderName: string,
  holderLastName: string,
  installments: number
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
    MatSelectModule
  ],
  templateUrl: './hotel-booking-payment-info.component.html',
  styleUrl: './hotel-booking-payment-info.component.scss'
})
export class HotelBookingPaymentInfoComponent implements OnInit {
  paymentTypeSelected:"NOW"|"DELAYED"="NOW";
  @ViewChild('ccNumber') ccNumber!: CreditCardFormatDirective;
  @Input() amount!:number;
  @Output() paymentType:EventEmitter<"NOW"|"DELAYED"> = new EventEmitter();
  @Output() paymentMethod:EventEmitter<"CARD"|"CASH"|"SPEI"> = new EventEmitter();
  @Output() cardData:EventEmitter<PaymentCardData> = new EventEmitter();
  //@ViewChild('paymentMethodTabs') paymentMethodTabs!: MatTabGroup;
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
  constructor(private clip: ClipSDKService) { }
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
        this.cardData.emit(value);
      }else{
        this.cardData.emit(undefined);
      }
    });
    this.paymentType.emit(this.paymentTypeSelected);
    
  }
  changePaymentType(){
    console.log("Chance Payment Type"); 
    this.paymentType.emit(this.paymentTypeSelected);
  }
  changePaymentMethod(tab:MatTabChangeEvent){
    console.log(tab);
    switch(tab.index){
      case 0:
        this.paymentMethod.emit("CARD");
        break;
      case 1:
        this.paymentMethod.emit("CASH");
        break;
      case 2:
        this.paymentMethod.emit("SPEI");
        break;
    }
  }
}

import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CreditCardDirectivesModule, CreditCardFormatDirective, CreditCardValidators } from 'angular-cc-library';
import { FirebaseBooking } from '../../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { MatListModule, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { debounceTime } from 'rxjs';
import { ClipSDKService, PaymentDetails } from '../../../../services/clip-sdk.service';
import { Installment, Issuer } from '../../../../types/installments.clip.type';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { CardType, XploraCardServicesService } from '../../../../services/xplora-card-services.service';
import { Timestamp } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { SiteIdentityService } from '../../../../services/site-identity.service';
export interface StoredCardPaymentData{
  bookingId: string;
  number: string;  
  expiration: string;
  cvv: string;
  installments: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date | Timestamp;
  holder: string,
  amount: number;
  type: CardType;
}

@Component({
  selector: 'app-xplora-card-element',
  imports: [ReactiveFormsModule, FormsModule, MatInputModule, MatIconModule, MatSelectModule, MatFormFieldModule, CommonModule, MatListModule, CreditCardDirectivesModule, FontAwesomeModule, MatButtonModule],
  templateUrl: './xplora-card-element.component.html',
  styleUrl: './xplora-card-element.component.scss',
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
export class XploraCardElementComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  @ViewChild('installments') installmentsList?: MatSelectionList;
  @ViewChild('ccNumber') ccNumber!: CreditCardFormatDirective;
  @Output() paymentCompleted = new EventEmitter<boolean>();
  spinnerIcon = faSpinner;
  cardIssuer?:Issuer;
  availableInstallments?:Installment[];
  loading:boolean=false;
  total=0;
  readonly site = this.siteIdentity.config;
  cardForm:FormGroup = new FormGroup({
    number: new FormControl('', [CreditCardValidators.validateCCNumber]),
    type: new FormControl(''),
    expiration: new FormControl('', [CreditCardValidators.validateExpDate]),
    cvv: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(4)]),
    holder: new FormControl('', [Validators.required])
  });
  constructor(
    private clip: ClipSDKService,
    private card: XploraCardServicesService,
    private sb: MatSnackBar,
    private siteIdentity: SiteIdentityService
  ){

  }
  ngOnInit(): void {
    this.total = this.booking.payment!.totalDue;
    this.cardForm.controls['number'].valueChanges.pipe(debounceTime(750)).subscribe((CCnumber:string)=>{
          if(this.cardForm.controls['number'].valid){
            this.cardForm.controls['type'].setValue(this.ccNumber.resolvedScheme$.value);
            const bin = CCnumber.replace(/\s/g, "").slice(0,6);
            const type = ['visa', 'mastercard', 'amex'].includes(this.ccNumber.resolvedScheme$.value.toLowerCase()) 
              ? this.ccNumber.resolvedScheme$.value.toLowerCase() === 'mastercard' 
                ? 'master' 
                : this.ccNumber.resolvedScheme$.value.toLowerCase()
              : undefined;
            if(bin&&type){
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
  }
  installmentsChange(event:MatSelectionListChange){
    this.cardForm.controls['installments'].setValue(event.options[0].value);
  }
  processPayment(){
    this.loading = true;
    const card = this.cardForm.value as PaymentDetails;
    const cardPaymentData = {
      ...card,
      amount: this.total,
      createdAt: new Date(),
      bookingId: this.booking.bookingID!,
      status: "failed",
    }
    this.card.addPayment(this.booking.bookingID!, cardPaymentData as StoredCardPaymentData).then(()=>{
      setTimeout(() => {
        this.loading = false;
        this.paymentCompleted.emit(true);
        this.sb.open('El pago con tu tarjeta ha sido rechazado. Por favor, verifica los datos ingresados o intenta con otra tarjeta.', 'Cerrar', {duration: 5000});
      }, 3500);
    }).catch(err=>{
      this.loading = false;
      this.paymentCompleted.emit(false);
      this.sb.open('Ha ocurrido un error al procesar tu pago. Por favor, intenta nuevamente.', 'Cerrar', {duration: 3000});
    });
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { CardType, StoredCardPaymentData, XploraCardServicesService } from '../../../../services/xplora-card-services.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TimeAgoPipe } from '../../../../time-ago.pipe';
import { FontAwesomeModule, IconDefinition } from '@fortawesome/angular-fontawesome';
import { faClock, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { faCcAmex, faCcDinersClub, faCcDiscover, faCcJcb, faCcMastercard, faCcVisa } from '@fortawesome/free-brands-svg-icons'
import { Timestamp } from 'firebase/firestore';
import { PaymentResponseData } from '../../../../types/installments.clip.type';
interface StoredCardPaymentDataFirebase extends StoredCardPaymentData {
  createdAt: Timestamp
}
interface DisplayCardData {
  cardType: CardType;
  last: string;
  first: string;
  brandIcon: IconDefinition;
  createdAt: Timestamp;
}

@Component({
  selector: 'app-card-transaction-list',
  imports: [CommonModule, MatCardModule, TimeAgoPipe, FontAwesomeModule],
  templateUrl: './card-transaction-list.component.html',
  styleUrl: './card-transaction-list.component.scss'
})
export class CardTransactionListComponent implements OnInit {
  @Input() bookingId!:string;
  @Input() total!: number;
  @Input() payed!: number;
  paymentPending:number = 0;
  savedPayments:StoredCardPaymentDataFirebase[]=[];
  timeIcon=faClock;
  paymentList:DisplayCardData[] = [];
  constructor(private cards: XploraCardServicesService){

  }
  async ngOnInit() {
    const payments = (await this.cards.getPaymentsByBooking(this.bookingId));
    this.savedPayments = payments.map(payment=>{
      return {
        ...payment,
        createdAt: payment.createdAt as Timestamp
      }
    });
    this.paymentPending = this.total-this.payed;
    this.cards.getGatewayPaymentsByBooking(this.bookingId).subscribe(payments=>{
      console.log(payments);
    });
  }
  getCardIcon(type: CardType){
    let icon:IconDefinition = faCreditCard;
    switch(type){
      case 'visa':
        icon = faCcVisa;
      break;
      case 'mastercard':
        icon = faCcMastercard;
      break;
      case 'amex':
        icon = faCcAmex;
      break;
      case 'dinersclub':
        icon = faCcDinersClub;
      break;
      case 'discover':
        icon = faCcDiscover;
      break;
      case 'jcb':
        icon = faCcJcb;
      break;
      default: 
        icon = faCreditCard
      break;
    }
    return icon;
  }
}

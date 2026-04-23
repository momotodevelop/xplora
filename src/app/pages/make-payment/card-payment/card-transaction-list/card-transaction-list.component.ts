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
import { map } from 'rxjs';
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

interface GatewayPaymentRecord {
  id: string;
  processor: string;
  processed_at: Timestamp;
  response_data: {
    event?: string;
    source?: string;
    status?: number;
    amount?: number;
    flowOrder?: number;
    commerceOrder?: string;
  };
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
  gatewayPayments: GatewayPaymentRecord[] = [];
  timeIcon=faClock;
  paymentList:DisplayCardData[] = [];
  constructor(private cards: XploraCardServicesService){

  }
  async ngOnInit() {
    this.cards.getPaymentsByBooking(this.bookingId).pipe(
      map(payments =>
        payments.map(payment => ({
          ...payment,
          createdAt: (payment.createdAt as Timestamp)
        }))
      )
    ).subscribe(payments=>{
      this.savedPayments = payments;
    });
    this.paymentPending = this.total-this.payed;
    this.cards.getGatewayPaymentsByBooking(this.bookingId).subscribe(payments=>{
      this.gatewayPayments = payments
        .map(payment => ({
          ...payment,
          processed_at: payment.processed_at as Timestamp,
        }))
        .sort((a, b) => b.processed_at.toMillis() - a.processed_at.toMillis()) as GatewayPaymentRecord[];
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

  getGatewayTitle(payment: GatewayPaymentRecord): string {
    switch (payment.response_data?.event) {
      case 'FLOW_ORDER_CREATED':
        return 'Checkout Flow creado';
      case 'FLOW_STATUS_SYNC':
        return payment.response_data?.source === 'confirmation'
          ? 'Pago confirmado por Flow'
          : 'Retorno desde Flow';
      default:
        return `Evento ${payment.processor}`;
    }
  }

  getGatewayStatus(payment: GatewayPaymentRecord): { label: string; className: string } {
    switch (payment.response_data?.status) {
      case 1:
        return { label: 'Pendiente', className: 'bg-warning text-dark' };
      case 2:
        return { label: 'Validando', className: 'bg-info text-dark' };
      case 3:
        return { label: 'Rechazado', className: 'bg-danger' };
      case 4:
        return { label: 'Cancelado', className: 'bg-secondary' };
      default:
        return { label: 'Creado', className: 'bg-primary' };
    }
  }
}

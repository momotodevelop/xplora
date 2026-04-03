import { Component, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FirebaseBooking } from '../../../types/booking.types';
import { CountdownConfig, CountdownEvent, CountdownModule } from 'ngx-countdown';
import { WhatsAppUrlManagerService } from '../../../services/whatsapp-url-manager.service';
import { SpeiAccount } from '../../../types/payment-config.types';
import { XploraSpeiAccountsService } from '../../../services/xplora-spei-accounts.service';

@Component({
  selector: 'app-spei-payment',
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInput,
    MatFormFieldModule,
    CommonModule,
    CountdownModule

  ],
  templateUrl: './spei-payment.component.html',
  styleUrl: './spei-payment.component.scss'
})
export class SpeiPaymentComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  locator: string = '';
  countdownConfig:CountdownConfig = { leftTime: 600, format: 'mm:ss', notify: [60] };
  leftTime: number = 600; // Tiempo restante para el pago en segundos
  countdownDanger: boolean = false; // Indica si el temporizador está en estado peligroso
  countdownCompleted: boolean = false; // Indica si el temporizador ha completado su cuenta atrás
  account?: SpeiAccount;
  constructor(private wa: WhatsAppUrlManagerService, private speiAccounts: XploraSpeiAccountsService) {}
  ngOnInit(): void {
    //this.booking.contact!.name
    this.locator = this.booking.created!.seconds.toString().slice(-7) || '';
    const remainingTime = this.getRemainingSeconds(this.booking.payment!.paymentLimit!.toDate());
    //console.log(this.booking.payment!.status==='VALIDATING');
    this.countdownConfig.leftTime = remainingTime;
    this.leftTime = remainingTime;
    if(remainingTime <= 60){
      //console.log("Tiempo restante:", remainingTime);
      this.countdownDanger = true; // Cambia el estado a peligroso si el tiempo restante es menor o igual a 60 segundos
      if(remainingTime <= 0){
        this.countdownCompleted = true; // Marca el temporizador como completado si el tiempo restante es 0 o negativo
      }
    }

    this.speiAccounts.watchAccounts().subscribe(accounts => {
      const amount = this.booking.payment?.totalDue ?? 0;
      this.account = this.selectAccount(accounts ?? [], amount);
    });

  }

  private selectAccount(accounts: SpeiAccount[], amount: number): SpeiAccount | undefined {
    const activeAccounts = accounts.filter(account => account.active);
    if (activeAccounts.length === 0) {
      return undefined;
    }
    const amountValue = Number(amount);
    const safeAmount = Number.isFinite(amountValue) ? amountValue : 0;
    const minValue = (account: SpeiAccount) => {
      const parsed = Number(account.minAmount ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const maxValue = (account: SpeiAccount) => {
      if (account.maxAmount === null || account.maxAmount === undefined) return Infinity;
      const parsed = Number(account.maxAmount);
      return Number.isFinite(parsed) ? parsed : Infinity;
    };
    const sorted = [...activeAccounts].sort((a, b) => minValue(a) - minValue(b));
    const matches = sorted.filter(account => {
      return safeAmount >= minValue(account) && safeAmount <= maxValue(account);
    });
    if (matches.length > 0) {
      return matches.sort((a, b) => {
        const maxA = maxValue(a);
        const maxB = maxValue(b);
        if (maxA !== maxB) return maxA - maxB;
        return minValue(b) - minValue(a);
      })[0];
    }
    const openEnded = sorted.find(account => account.maxAmount === null || account.maxAmount === undefined);
    if (openEnded) return openEnded;
    return sorted[sorted.length - 1];
  }
  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Texto copiado al portapapeles');
        // Aquí puedes lanzar un snackbar, toast, alert, etc.
      }).catch(err => {
        console.error('Error al copiar al portapapeles: ', err);
      });
    } else {
      console.warn('Clipboard API no soportada, usa un fallback');
      // Fallback: método tradicional (menos seguro)
      this.fallbackCopyText(text);
    }
  }

  private fallbackCopyText(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';  // Evita que haga scroll
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('Texto copiado con fallback');
      } else {
        console.warn('El comando copy falló');
      }
    } catch (err) {
      console.error('Error al usar fallback de copy: ', err);
    }
    document.body.removeChild(textarea);
  }
  countdownNotify(event: CountdownEvent){
      //console.log(event);
      if(event.action==='notify'){
        const leftTime = event.left / 1000; // Convertir a segundos
        if(leftTime <= 60){
          //console.log("Tiempo restante:", event.left);
          this.countdownDanger = true; // Cambia el estado a peligroso si el tiempo restante es menor o igual a 60 segundos
        }
      }else if(event.action==='done'){
        //console.log("Temporizador completado");
        this.countdownCompleted = true; // Marca el temporizador como completado
      }
  }
  openWhatsAppContact() {
    this.wa.redirectToMessage('expirado', { clave: this.booking.bookingID!.slice(-6).toUpperCase() });
  }

  getRemainingSeconds(target: Date): number {
    const now = Date.now();
    const targetTime = target.getTime();
    const diffInSeconds = Math.floor((targetTime - now) / 1000);
    return Math.max(diffInSeconds, 0);
  }
  
}

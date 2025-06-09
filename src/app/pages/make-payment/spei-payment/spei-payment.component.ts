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
  countdownConfig:CountdownConfig = { leftTime: 300, format: 'mm:ss', notify: [60] };
  leftTime: number = 300; // Tiempo restante para el pago en segundos
  countdownDanger: boolean = false; // Indica si el temporizador está en estado peligroso
  countdownCompleted: boolean = false; // Indica si el temporizador ha completado su cuenta atrás
  ngOnInit(): void {
    //this.booking.contact!.name
    this.locator = this.booking.created?.toDate().getTime().toString().slice(-7) || '';
    const remainingTime = this.getRemainingSeconds(this.booking.payment!.paymentLimit!.toDate());
    console.log(this.booking.payment!.status==='VALIDATING');
    this.countdownConfig.leftTime = remainingTime;
    this.leftTime = remainingTime;
    if(remainingTime <= 60){
      console.log("Tiempo restante:", remainingTime);
      this.countdownDanger = true; // Cambia el estado a peligroso si el tiempo restante es menor o igual a 60 segundos
      if(remainingTime <= 0){
        this.countdownCompleted = true; // Marca el temporizador como completado si el tiempo restante es 0 o negativo
      }
    }

  }
  copiarAlPortapapeles(text:string){
    this.booking.bookingID;
  }
  countdownNotify(event: CountdownEvent){
      console.log(event);
      if(event.action==='notify'){
        const leftTime = event.left / 1000; // Convertir a segundos
        if(leftTime <= 60){
          console.log("Tiempo restante:", event.left);
          this.countdownDanger = true; // Cambia el estado a peligroso si el tiempo restante es menor o igual a 60 segundos
        }
      }else if(event.action==='done'){
        console.log("Temporizador completado");
        this.countdownCompleted = true; // Marca el temporizador como completado
      }
    }
  getRemainingSeconds(target: Date): number {
    const now = Date.now();
    const targetTime = target.getTime();
    const diffInSeconds = Math.floor((targetTime - now) / 1000);
    return Math.max(diffInSeconds, 0);
  }
  
}

import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { StripeCheckoutService } from '../../../../services/stripe-checkout.service';
import { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FirebaseBooking } from '../../../../types/booking.types';

@Component({
  selector: 'app-stripe-card-element',
  imports: [CommonModule],
  templateUrl: './stripe-card-element.component.html',
  styleUrl: './stripe-card-element.component.scss'
})
export class StripeCardElementComponent implements AfterViewInit, OnInit {
  @Input() booking!: FirebaseBooking;
  @ViewChild('stripe_element') paymentEl!: ElementRef<HTMLDivElement>;
  constructor(private stripeService: StripeCheckoutService, private sb: MatSnackBar) {}
  stripe?: Stripe;
  elements?: StripeElements;
  total_due: number = 0;
  readyToPay: boolean = false;

  ngOnInit(): void {
    console.log(this.booking);
  }

  async ngAfterViewInit() {
    console.log(this.booking);
    if (!this.booking || !this.booking.payment) {
      this.sb.open('Detalles de pago no disponibles', 'Cerrar', { duration: 3000 });
      return;
    }else{
      this.total_due = this.booking.payment.totalDue - this.booking.payment.payed;
      if (this.total_due <= 0) {
        this.sb.open('El total a pagar ya ha sido cubierto', 'Cerrar', { duration: 3000 });
        return;
      }
      this.stripeService.createPaymentIntent({
        bookingId: this.booking.bookingID,
        amount: this.total_due,
        currency: 'mxn',
        customerEmail: this.booking.contact!.email,
        activePaymentMethods: ['card'],
        returnUrl: 'https://xplora.mx/reservar/realizar-pago/',
        attemptId: this.booking.payment.paymentLimit!.toDate().getTime().toString()+'-'+this.booking.bookingID+'-'+this.total_due.toString()
      }).then(ok=>{
        if(ok && ok.clientSecret){
          this.mountCardElement(ok?.clientSecret);
        }
      });
    }
  }
  confirmPayment() {
    if (!this.stripe || !this.elements) {
      console.error('Stripe or Elements not initialized');
      return;
    }
    this.stripeService.confirmWithPaymentElement(this.stripe, this.elements).then((paymentIntent) => {
      console.log('Payment confirmed:', paymentIntent);
    }).catch((error) => {
      console.error('Payment confirmation error:', error);
      this.sb.open(error.message, 'Cerrar', { duration: 3000 });
    });
  }
  async mountCardElement(clientSecret: string) {
    const { stripe, elements } = await this.stripeService.createElements(clientSecret);
    const paymentElement = elements.create('payment', {fields: { billingDetails: { name: 'auto', address: { country: 'auto', postalCode: 'auto', city: 'auto', line1: 'auto' } } }});
    paymentElement.mount(this.paymentEl.nativeElement);
    this.stripe = stripe;
    this.elements = elements;
    paymentElement.on('change', (event) => {
      console.log('Payment Element change event:', event);
      if(event.complete) {
        this.readyToPay = true;
      }else{
        this.readyToPay = false;
      }
    });
  }
}

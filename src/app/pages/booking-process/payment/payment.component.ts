import { Component, OnInit } from '@angular/core';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraPaymentsService } from '../../../services/xplora-payments.service';
import { debounceTime, first, forkJoin, map } from 'rxjs';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Promo } from '../../../services/xplora-promos.service';
import { DiscountsMP } from '../../../types/mp.types';
import { environment } from '../../../../environments/environment';
declare const MercadoPago: any;
declare global {
  interface Window { paymentBrickController: any; }
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CurrencyPipe, CommonModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
  providers: [CurrencyPipe]
})
export class PaymentComponent implements OnInit {
  total:number=0;
  constructor(public bookingHandler: BookingHandlerService, private payments: XploraPaymentsService, private currency: CurrencyPipe){
    
  }
  ngOnInit(): void {
    this.bookingHandler.prices.pipe(debounceTime(1500)).subscribe(prices=>{
      console.log(prices[0]);
      console.log(this.total);
      this.total = prices[0];
      if(prices[0]>0){
        this.bookingHandler.booking.pipe(first()).subscribe(booking=>{
          if(booking){
            if(booking.contact&&prices[0]>0){
              const pnr:string = booking.bookingID.slice(-6).toUpperCase();
              const preferenceData = {
                booking_PNR: pnr,
                amount: prices[0],
                contact_info: {
                  name: booking.contact.name,
                  surname: booking.contact.lastname,
                  email: booking.contact.email
                },
                production: environment.production
              }
              this.payments.createPreferenceMP(preferenceData).subscribe(preference=>{
                this.initializeMercadoPago(preference.id, [prices[0], prices[1]], preferenceData.contact_info, pnr, prices[2]);
              })
          }
        }});
      }
    });
  }

  initializeMercadoPago(preference:string, prices:number[], contact: {name: string;surname: string;email: string;}, pnr: string, promo?: Promo): void {
    const mp = new MercadoPago(environment.mpPublicKey, {
      locale: 'es-MX'
    });

    const bricksBuilder = mp.bricks();
    window.paymentBrickController = undefined;

    this.renderPaymentBrick(bricksBuilder, preference, prices, contact, pnr, promo);
  }

  async renderPaymentBrick(bricksBuilder: any, preferenceId:string, prices: number[], contact:{name: string;surname: string;email: string;}, pnr: string, promo?: Promo) {
    const brickContainer = document.getElementById("paymentBrick_container");
    if(brickContainer){
      brickContainer.innerHTML = "";
    }
    let discounts:DiscountsMP|undefined;
    if(promo){
      discounts = {
        totalDiscountsAmount: 1,
        discountsList: [{
          name: promo.code,
          value: prices[1]
        }]
      }
    }
    const settings = {
      initialization: {
        amount: prices[0],
        preferenceId,
        payer: {
          firstName: contact.name,
          lastName: contact.surname,
          email: contact.email,
        },
        items: {
          totalItemsAmount: prices[0]+prices[1],
          itemsList: [
            {
              units: 1,
              value: prices[0]+prices[1],
              name: "Reservación "+pnr
            }
          ],
        },
        discounts
      },
      customization: {
        visual: {
          style: {
            theme: "bootstrap",
            customVariables: {
              baseColor: "#004AAD",
              fontSizeExtraLarge: "14",
              formPadding: "8px"
            }
          },
          texts: {
            formSubmit: "Pagar "+this.currency.transform(prices[0], 'MXN')
          },
          hidePaymentButton: true
        },
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          ticket: "all",
          atm: "all",
          bankTransfer: "all",
          mercadoPago: "all",
          maxInstallments: 12
        },
      },
      callbacks: {
        onReady: () => {
          console.log("Payment Brick is ready");
        },
        onSubmit: ({ selectedPaymentMethod, formData }: any) => {
          return new Promise<void>((resolve, reject) => {
            fetch("/process_payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(formData),
            })
              .then(response => response.json())
              .then(response => {
                resolve();
              })
              .catch(error => {
                reject();
              });
          });
        },
        onError: (error: any) => {
          console.error(error);
        },
      },
    };
    console.log(settings);
    window.paymentBrickController = await bricksBuilder.create(
      "payment",
      "paymentBrick_container",
      settings
    );
  }
  createPayment(){
    window.paymentBrickController.getFormData().then((data:any)=>{
      console.log(data);
      this.payments.createPaymentMP(data, "AAABBB", true).subscribe(payment=>{
        console.log(payment);
      });
    })
  }
}

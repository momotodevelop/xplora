import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FirebaseBooking } from '../../../../types/booking.types';
import { FlowPaymentService } from '../../../../services/flow-payment.service';

@Component({
  selector: 'app-flow-redirect-payment',
  imports: [CommonModule, MatButtonModule, MatSnackBarModule],
  templateUrl: './flow-redirect-payment.component.html',
  styleUrl: './flow-redirect-payment.component.scss'
})
export class FlowRedirectPaymentComponent {
  @Input() booking!: FirebaseBooking;
  creatingCheckout = false;
  private readonly isBrowser: boolean;

  constructor(
    private flowPayments: FlowPaymentService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  get pendingAmount(): number {
    const total = Number(this.booking?.payment?.totalDue || 0);
    const payed = Number(this.booking?.payment?.payed || 0);
    return Math.max(total - payed, 0);
  }

  get payButtonLabel(): string {
    return `Pagar ${new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(this.pendingAmount)}`;
  }

  get canStartCheckout(): boolean {
    const bookingStatus = this.booking?.status;
    const paymentStatus = this.booking?.payment?.status;

    if (!this.booking?.bookingID || this.pendingAmount <= 0) {
      return false;
    }

    return bookingStatus !== 'VALIDATING' && paymentStatus !== 'VALIDATING';
  }

  startCheckout(): void {
    if (!this.booking?.bookingID || !this.canStartCheckout || this.creatingCheckout) {
      return;
    }

    this.creatingCheckout = true;
    this.flowPayments.createCheckoutSession(this.booking.bookingID).subscribe({
      next: (session) => {
        if (!this.isBrowser) {
          this.creatingCheckout = false;
          return;
        }

        window.location.assign(session.checkoutUrl);
      },
      error: (error) => {
        console.error('No fue posible iniciar el checkout de pago:', error);
        this.creatingCheckout = false;
        this.snackBar.open(
          error?.error?.message || 'No fue posible iniciar el pago en línea. Intenta nuevamente.',
          'Cerrar',
          { duration: 6000 }
        );
      }
    });
  }
}

import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { FirebaseBooking } from '../../../types/booking.types';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CountdownConfig, CountdownEvent, CountdownModule } from 'ngx-countdown';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPrintModule } from 'ngx-print';
import { WhatsAppUrlManagerService } from '../../../services/whatsapp-url-manager.service';
import { PaymentOffice, PaymentOfficeStep, PaymentStepElement } from '../../../types/payment-config.types';
import { XploraPaymentOfficesService } from '../../../services/xplora-payment-offices.service';

@Component({
  selector: 'app-cash-payment',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInput,
    MatFormFieldModule,
    CommonModule,
    CountdownModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPrintModule
  ],
  templateUrl: './cash-payment.component.html',
  styleUrl: './cash-payment.component.scss'
})
export class CashPaymentComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  locator: string = '';
  paymentOffices: PaymentOffice[] = [];
  selectedOffice?: PaymentOffice;
  instructionSteps: PaymentOfficeStep[] = [];
  officeSelector: FormControl = new FormControl(null, [Validators.required]);
  countdownConfig: CountdownConfig = { leftTime: 300, format: 'hh:mm:ss', notify: [60] };
  countdownDanger: boolean = false;
  countdownCompleted: boolean = false;
  paymentList: { amount: number, count: number }[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private wa: WhatsAppUrlManagerService,
    private paymentOfficesService: XploraPaymentOfficesService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Browser-only hooks can be added here if needed.
    }

    if(this.booking.payment!.paymentLimit){
      const paymentLimit = this.booking.payment!.paymentLimit.toMillis();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((paymentLimit - now) / 1000));
      this.countdownConfig.leftTime = secondsLeft;
    }

    this.paymentOfficesService.watchOffices().subscribe(offices => {
      this.paymentOffices = (offices ?? []).filter(office => office.active !== false);
      const officeId = this.booking.payment?.office;
      if (officeId) {
        this.officeSelector.setValue(officeId, { emitEvent: false });
        this.resolveSelectedOffice(officeId);
      }
    });

    this.officeSelector.valueChanges.subscribe(value => {
      if (value) {
        this.resolveSelectedOffice(value);
      } else {
        this.selectedOffice = undefined;
        this.paymentList = [];
      }
    });
  }

  private resolveSelectedOffice(officeId: string): void {
    this.selectedOffice = this.paymentOffices.find(office => office.id === officeId);
    if (this.selectedOffice) {
      this.instructionSteps = this.normalizeSteps(this.selectedOffice.steps ?? []);
      const maxAmount = this.selectedOffice.maxPerOperation && this.selectedOffice.maxPerOperation > 0
        ? this.selectedOffice.maxPerOperation
        : this.booking.payment!.totalDue!;
      this.paymentList = this.getPaymentBreakdown(this.booking.payment!.totalDue!, maxAmount).sort((b, a) => a.amount - b.amount);
    } else {
      this.instructionSteps = [];
      this.paymentList = [];
    }
  }

  private normalizeSteps(steps: PaymentOfficeStep[]): PaymentOfficeStep[] {
    return (steps ?? []).filter(step => Array.isArray(step?.elements) && step.elements.length > 0);
  }

  formatText(value: string): string {
    const officeName = this.selectedOffice?.name ?? '';
    const account = this.selectedOffice?.account ?? '';
    const codeLabel = this.selectedOffice?.referenceLabel || 'codigo';
    const amount = this.booking.payment?.totalDue ?? 0;
    const amountFormatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    return String(value ?? '')
      .replaceAll('{officeName}', officeName)
      .replaceAll('{account}', account)
      .replaceAll('{codeLabel}', codeLabel)
      .replaceAll('{amount}', amountFormatted);
  }

  getElementValue(element: PaymentStepElement): string {
    const value = String((element as any)?.value ?? '').trim();
    if (value) return value;
    const useOfficeAccount = (element as any)?.useOfficeAccount !== false;
    if (useOfficeAccount) {
      return this.selectedOffice?.account ?? '';
    }
    return '';
  }

  getStepLabel(stepNumber: number): string {
    const emojiSteps = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return emojiSteps[stepNumber - 1] ?? `${stepNumber}.`;
  }

  get amountStepNumber(): number {
    return this.instructionSteps.length + 1;
  }

  get receiptStepNumber(): number {
    return this.instructionSteps.length + 2;
  }

  get uploadStepNumber(): number {
    return this.instructionSteps.length + 3;
  }

  getReferenceLabel(): string {
    return this.selectedOffice?.referenceLabel || 'el mismo codigo proporcionado';
  }

  openWhatsAppContact() {
    this.wa.redirectToMessage('expirado', { clave: this.booking.bookingID!.slice(-6).toUpperCase() });
  }

  countdownNotify(event: CountdownEvent) {
    if (event.action === 'notify') {
      const leftTime = event.left / 1000;
      if (leftTime <= 60) {
        this.countdownDanger = true;
      }
    } else if (event.action === 'done') {
      this.countdownCompleted = true;
    }
  }

  getPaymentBreakdown(totalAmount: number, maxAmount: number): { amount: number, count: number }[] {
    if (maxAmount <= 0) {
      return [{ amount: totalAmount, count: 1 }];
    }
    const flatPayments: number[] = [];
    while (totalAmount > maxAmount) {
      flatPayments.push(maxAmount);
      totalAmount -= maxAmount;
    }
    if (totalAmount > 0) {
      flatPayments.push(totalAmount);
    }
    const grouped: { [key: number]: number } = {};
    for (const payment of flatPayments) {
      grouped[payment] = (grouped[payment] || 0) + 1;
    }
    return Object.entries(grouped).map(([amount, count]) => ({
      amount: +amount,
      count
    }));
  }
}

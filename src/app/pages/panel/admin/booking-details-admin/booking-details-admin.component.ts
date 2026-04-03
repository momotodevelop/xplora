import { Component, inject, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { BookingStatus, FirebaseBooking, PaymentMethod, PaymentStatus } from '../../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { Timestamp } from '@angular/fire/firestore';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSelectModule } from '@angular/material/select';
import { BookingStatusPipe } from '../../../../booking-status.pipe';
import { PaymentStatusPipe } from '../../../../payment-status.pipe';
import { PaymentMethodPipe } from '../../../../payment-method.pipe';
import { MatIconModule } from '@angular/material/icon';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { BookingContactMessagesService, BookingContactTemplateKey } from '../../../../services/booking-contact-messages.service';
import { VoucherPrintable, VoucherTransformService } from '../../../../services/voucher-transform.service';
import { WhatsAppUrlManagerService } from '../../../../services/whatsapp-url-manager.service';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

const EXPIRATION_HOURS = 6;

@Component({
  selector: 'app-booking-details-admin',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatBottomSheetModule,
    BookingStatusPipe,
    PaymentStatusPipe,
    PaymentMethodPipe,
    MatIconModule
  ],
  templateUrl: './booking-details-admin.component.html',
  styleUrl: './booking-details-admin.component.scss'
})
export class BookingDetailsAdminComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private bookings: FireBookingService,
    private fb: FormBuilder,
    private bottomSheet: MatBottomSheet,
    private contactMessages: BookingContactMessagesService,
    private vouchers: VoucherTransformService,
    private wa: WhatsAppUrlManagerService,
    private meta: MetaHandlerService
  ) {}
  booking!: FirebaseBooking;
  pnr?: string;
  passengersForm?: FormArray;
  paymentLimitMin: Date | null = null;
  statusOptions: BookingStatus[] = ['CONFIRMED', 'PENDING', 'HOLD', 'CANCELED', 'REJECTED', 'VALIDATING'];
  paymentMethods: PaymentMethod[] = ['CARD', 'CASH', 'SPEI', 'PAYPAL'];
  paymentStatusOptions: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'VALIDATING'];
  generatedMessage: string = '';
  messageTemplateSelector: FormControl = new FormControl({value: 'booking_received', disabled: false});
  
  private readonly paymentFollowUpTemplate = ['{{ greeting }}', '{{ paymentFollowUpText }}'].join(' ');
  ngOnInit() {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Detalle de Reservación',
      description: 'Revisa y gestiona los detalles de una reservación en el panel administrativo de Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    const bookingID = this.route.snapshot.paramMap.get('bookingID');
    if (bookingID) {
      this.bookings.watchBooking(bookingID).subscribe(booking => {
        if (!booking) return;
        this.booking = booking;
        this.pnr = booking.bookingID ? booking.bookingID.slice(-6) : undefined;
        this.generateMessage(booking, this.messageTemplateSelector.value);
      });
    }
    this.messageTemplateSelector.valueChanges.subscribe(value => {
      this.generateMessage(this.booking, value);
    });
  }

  async generateMessage(booking: FirebaseBooking, templateKey: BookingContactTemplateKey) {
    const voucherPrintable = this.vouchers.transformFirebaseBookingToVoucher(booking);
    console.log(voucherPrintable);
    this.generatedMessage = await this.contactMessages.render(templateKey, voucherPrintable);
  }

  get passengerControls(): FormGroup[] {
    return (this.passengersForm?.controls as FormGroup[]) ?? [];
  }

  toDate(value: unknown): Date | null {
    if (!value) return null;
    // Firestore Timestamp tiene método toDate; si ya es Date la regresamos directa
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
  }

  sendWA(message: string) {
    const phone = this.booking.contact?.country_code ? `${this.booking.contact.country_code}${this.booking.contact.phone.replace(/[+\-\s]/g, '')}` : this.booking.contact!.phone.replace(/[+\-\s]/g, '');
    const url = this.wa.getUrlFromMessage(message, phone);
    window.open(url, '_blank');
  }

  openEditPaymentSheet() {
    this.bottomSheet.open(BookingDetailsAdminEditPaymentSheet, {
      data: { booking: this.booking }
    });
  }

  copyToClipboard(text: string) {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      return;
    }
    if (typeof document === 'undefined') return;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
@Component({
  selector: 'app-booking-details-admin-edit-payment-sheet',
  templateUrl: './edit-payment-sheet.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    BookingStatusPipe,
    PaymentStatusPipe,
    PaymentMethodPipe,
    MatIconModule,
    MatTimepickerModule
  ],
})
export class BookingDetailsAdminEditPaymentSheet implements OnInit {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { booking: FirebaseBooking }, 
    private fb: FormBuilder,
    private fireBooking: FireBookingService,
    
  ) {}
  private _bottomSheetRef = inject<MatBottomSheetRef<BookingDetailsAdminEditPaymentSheet>>(MatBottomSheetRef);
  form!: FormGroup;
  paymentLimitMin: Date = new Date();
  statusOptions: BookingStatus[] = ['CONFIRMED', 'PENDING', 'HOLD', 'CANCELED', 'REJECTED', 'VALIDATING'];
  paymentMethods: PaymentMethod[] = ['CARD', 'CASH', 'SPEI', 'PAYPAL'];
  paymentStatusOptions: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'VALIDATING'];

  ngOnInit(): void {
    this.form = this.fb.group({
      status: [this.data.booking.status],
      paymentMethod: [this.data.booking.payment?.method ?? null],
      paymentStatus: [this.data.booking.payment?.status ?? null],
      paymentLimit: [this.toDate(this.data.booking.payment?.paymentLimit)]
    });
    this.form.get('paymentLimit')?.valueChanges.subscribe(limit => this.adjustStatusBasedOnLimit(limit));
    this.form.get('status')?.valueChanges.subscribe(status => {
      if (status === 'PENDING') {
        this.paymentLimitMin = new Date();
      }
    });
    this.adjustStatusBasedOnLimit(this.form.value.paymentLimit);
  }

  private adjustStatusBasedOnLimit(limit: Date | null) {
    const statusControl = this.form.get('status');
    if (!limit || !statusControl) return;
    const now = Date.now();
    const isExpired = now - limit.getTime() > EXPIRATION_HOURS * 60 * 60 * 1000;
    const currentStatus = statusControl.value as BookingStatus;
    if (isExpired && currentStatus !== 'CANCELED') {
      statusControl.setValue('CANCELED', { emitEvent: false });
    } else if (!isExpired && currentStatus === 'CANCELED') {
      statusControl.setValue('PENDING', { emitEvent: false });
      this.paymentLimitMin = new Date();
    }
  }

  toDate(value: unknown): Date | null {
    if (!value) return null;
    // Firestore Timestamp tiene método toDate; si ya es Date la regresamos directa
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
  }
  save(){
    this.fireBooking.updateBooking(this.data.booking.bookingID!, {
      status: this.form.value.status ?? this.data.booking.status,
      payment: {
        type: this.data.booking.payment?.type ?? "NOW",
        method: this.form.value.paymentMethod ?? this.data.booking.payment?.method,
        status: this.form.value.paymentStatus ?? this.data.booking.payment?.status,
        paymentLimit: this.form.value.paymentLimit ? Timestamp.fromDate(this.form.value.paymentLimit) : this.data.booking.payment?.paymentLimit,
        originalAmount: this.data.booking.payment?.originalAmount ?? 0,
        amount: this.data.booking.payment?.amount ?? 0,
        totalDue: this.data.booking.payment?.totalDue ?? 0,
        payed: this.data.booking.payment?.payed ?? 0
      }
    }).then(()=>{
      this._bottomSheetRef.dismiss();
    });
  }
}

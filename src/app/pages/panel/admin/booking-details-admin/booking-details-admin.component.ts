import { Component, inject, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FireBookingService } from '../../../../services/fire-booking.service';
import { BookingStatus, FirebaseBooking, PaymentMethod, PaymentStatus, ReservationLinkedService } from '../../../../types/booking.types';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { BookingDisplayService, BookingDisplaySummary } from '../../../../services/booking-display.service';
import { getToneClass } from '../../../../utils/booking-display.utils';
import { UploadPaymentReceiptComponent } from '../../../../shared/upload-payment-receipt/upload-payment-receipt.component';
import { Charge } from '../../../booking-process/booking-sidebar/booking-sidebar.component';
import { ContactInfoValue } from '../../../booking-process/contact-info/contact-info.component';
import { PassengerValue } from '../../../booking-process/passengers/passengers.component';
import { XploraPaymentOfficesService } from '../../../../services/xplora-payment-offices.service';
import { PaymentOffice } from '../../../../types/payment-config.types';
import { Promo, XploraPromosService } from '../../../../services/xplora-promos.service';
import { FireAuthService, UserData } from '../../../../services/fire-auth.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { firstValueFrom } from 'rxjs';

const EXPIRATION_HOURS = 6;
const LINKED_SERVICE_TYPES = ['FLIGHT', 'HOTEL', 'TRANSPORTATION', 'ACTIVITY', 'PACKAGE', 'INSURANCE', 'BAGGAGE', 'SEAT', 'EXTRA'] as const;

function randomId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const timestamp = value as { toDate?: () => Date };
  return typeof timestamp.toDate === 'function' ? timestamp.toDate() : (value as Date);
}

function toTimestamp(value: unknown): Timestamp | undefined {
  const date = toDate(value);
  return date ? Timestamp.fromDate(date) : undefined;
}

function createChargeGroup(fb: FormBuilder, charge?: Charge): FormGroup {
  return fb.group({
    description: [charge?.description ?? '', [Validators.required]],
    amount: [numberValue(charge?.amount ?? 0), [Validators.required]],
    aditionalInfo: [(charge?.aditional_info ?? []).join('\n')]
  });
}

function buildChargeFromForm(group: FormGroup): Charge {
  const lines = String(group.value.aditionalInfo ?? '')
    .split('\n')
    .map((line: string) => line.trim())
    .filter(Boolean);

  return {
    description: String(group.value.description ?? '').trim(),
    amount: numberValue(group.value.amount),
    aditional_info: lines.length ? lines : undefined
  };
}

function applyPromoDiscount(subtotal: number, promo?: Promo | null): number {
  if (!promo) return subtotal;
  if (promo.discountType === 'percentage') {
    return Math.max(subtotal - (subtotal * promo.discountAmount / 100), 0);
  }
  return Math.max(subtotal - promo.discountAmount, 0);
}

function createPassengerAdminGroup(fb: FormBuilder, passenger?: PassengerValue): FormGroup {
  return fb.group({
    id: [passenger?.id ?? 0],
    name: [passenger?.name ?? '', [Validators.required]],
    lastname: [passenger?.lastname ?? '', [Validators.required]],
    birth: [toDate(passenger?.birth) ?? null, [Validators.required]],
    gender: [passenger?.gender ?? '', [Validators.required]],
    type: [passenger?.type ?? 'ADULT', [Validators.required]]
  });
}

function buildPassengerFromForm(group: FormGroup, index: number): PassengerValue {
  return {
    id: index,
    name: String(group.value.name ?? '').trim(),
    lastname: String(group.value.lastname ?? '').trim(),
    birth: Timestamp.fromDate(new Date(group.value.birth)),
    gender: String(group.value.gender ?? '').trim(),
    type: group.value.type
  } as PassengerValue;
}

function createLinkedServiceGroup(fb: FormBuilder, service?: ReservationLinkedService): FormGroup {
  return fb.group({
    id: [service?.id ?? randomId('svc')],
    type: [service?.type ?? 'EXTRA', [Validators.required]],
    title: [service?.title ?? '', [Validators.required]],
    status: [service?.status ?? 'PENDING'],
    provider: [service?.provider ?? ''],
    reference: [service?.reference ?? ''],
    origin: [service?.origin ?? ''],
    destination: [service?.destination ?? ''],
    location: [service?.location ?? ''],
    startDate: [toDate(service?.startDate)],
    endDate: [toDate(service?.endDate)],
    amount: [numberValue(service?.amount ?? 0)],
    quantity: [numberValue(service?.quantity ?? 1)],
    notes: [service?.notes ?? ''],
    included: [Boolean(service?.included ?? false)]
  });
}

function buildLinkedServiceFromForm(group: FormGroup): ReservationLinkedService {
  return {
    id: String(group.value.id ?? randomId('svc')),
    type: group.value.type,
    title: String(group.value.title ?? '').trim(),
    status: String(group.value.status ?? '').trim() || undefined,
    provider: String(group.value.provider ?? '').trim() || undefined,
    reference: String(group.value.reference ?? '').trim() || undefined,
    origin: String(group.value.origin ?? '').trim() || undefined,
    destination: String(group.value.destination ?? '').trim() || undefined,
    location: String(group.value.location ?? '').trim() || undefined,
    startDate: toTimestamp(group.value.startDate),
    endDate: toTimestamp(group.value.endDate),
    amount: numberValue(group.value.amount),
    quantity: numberValue(group.value.quantity),
    notes: String(group.value.notes ?? '').trim() || undefined,
    included: Boolean(group.value.included)
  };
}

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
    MatIconModule,
    UploadPaymentReceiptComponent
  ],
  templateUrl: './booking-details-admin.component.html',
  styleUrl: './booking-details-admin.component.scss'
})
export class BookingDetailsAdminComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private bookings: FireBookingService,
    private bottomSheet: MatBottomSheet,
    private contactMessages: BookingContactMessagesService,
    private vouchers: VoucherTransformService,
    private wa: WhatsAppUrlManagerService,
    private meta: MetaHandlerService,
    private display: BookingDisplayService,
    private auth: FireAuthService
  ) {}
  booking!: FirebaseBooking;
  summary!: BookingDisplaySummary;
  linkedUser: UserData | null = null;
  pnr?: string;
  passengersForm?: FormArray;
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
        this.summary = this.display.buildSummary(booking);
        this.pnr = booking.bookingID ? booking.bookingID.slice(-6) : undefined;
        this.loadLinkedUser(booking.uid);
        this.generateMessage(booking, this.messageTemplateSelector.value);
      });
    }
    this.messageTemplateSelector.valueChanges.subscribe(value => {
      if (this.booking) {
        this.generateMessage(this.booking, value);
      }
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
    return toDate(value);
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

  openEditContactSheet() {
    this.bottomSheet.open(BookingDetailsAdminEditContactSheet, {
      data: { booking: this.booking }
    });
  }

  openEditPassengersSheet() {
    if (this.booking.type !== 'FLIGHT') return;
    this.bottomSheet.open(BookingDetailsAdminEditPassengersSheet, {
      data: { booking: this.booking }
    });
  }

  openEditServicesSheet() {
    this.bottomSheet.open(BookingDetailsAdminEditServicesSheet, {
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

  getBadgeClass(tone: BookingDisplaySummary['lifecycleTone']): string {
    return getToneClass(tone);
  }

  getItineraryBadgeClass(item: BookingDisplaySummary['itinerary'][number]): string {
    return getToneClass(item.tone);
  }

  getServiceIcon(typeLabel: string): string {
    switch (typeLabel) {
      case 'Vuelo':
        return 'flight';
      case 'Hotel':
        return 'local_hotel';
      case 'Traslado':
        return 'directions_car';
      case 'Actividad':
        return 'local_activity';
      case 'Seguro':
        return 'verified_user';
      case 'Equipaje':
        return 'luggage';
      case 'Asiento':
        return 'event_seat';
      default:
        return 'inventory_2';
    }
  }

  private async loadLinkedUser(uid?: string) {
    this.linkedUser = uid ? await this.auth.getUserDataByUid(uid) : null;
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
    private promos: XploraPromosService,
    private paymentOfficesService: XploraPaymentOfficesService
  ) {}
  private _bottomSheetRef = inject<MatBottomSheetRef<BookingDetailsAdminEditPaymentSheet>>(MatBottomSheetRef);
  form!: FormGroup;
  paymentLimitMin: Date = new Date();
  statusOptions: BookingStatus[] = ['CONFIRMED', 'PENDING', 'HOLD', 'CANCELED', 'REJECTED', 'VALIDATING'];
  paymentMethods: PaymentMethod[] = ['CARD', 'CASH', 'SPEI', 'PAYPAL'];
  paymentStatusOptions: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'VALIDATING'];
  paymentOffices: PaymentOffice[] = [];
  selectedPromo: Promo | null = null;

  ngOnInit(): void {
    this.selectedPromo = this.data.booking.payment?.promo ?? null;
    this.form = this.fb.group({
      status: [this.data.booking.status],
      paymentMethod: [this.data.booking.payment?.method ?? null],
      paymentOffice: [this.data.booking.payment?.office ?? null],
      paymentStatus: [this.data.booking.payment?.status ?? null],
      paymentLimit: [toDate(this.data.booking.payment?.paymentLimit)],
      quotedTotal: [numberValue(this.data.booking.payment?.originalAmount ?? this.data.booking.payment?.totalDue ?? 0), [Validators.required]],
      confirmedTotal: [numberValue(this.data.booking.payment?.totalDue ?? this.data.booking.payment?.amount ?? 0), [Validators.required]],
      amountPaid: [numberValue(this.data.booking.payment?.payed ?? 0), [Validators.required]],
      promoCode: [this.data.booking.payment?.promo?.code ?? ''],
      charges: this.fb.array((this.data.booking.charges ?? []).map(charge => createChargeGroup(this.fb, charge)))
    });
    this.form.get('paymentLimit')?.valueChanges.subscribe(limit => this.adjustStatusBasedOnLimit(limit));
    this.form.get('status')?.valueChanges.subscribe(status => {
      if (status === 'PENDING') {
        this.paymentLimitMin = new Date();
      }
    });
    this.adjustStatusBasedOnLimit(this.form.value.paymentLimit);
    this.paymentOfficesService.watchOffices().subscribe(offices => {
      this.paymentOffices = (offices ?? []).filter(office => office.active !== false);
    });
    if (this.charges.length === 0) {
      this.addCharge();
    }
  }

  get charges(): FormArray<FormGroup> {
    return this.form.get('charges') as FormArray<FormGroup>;
  }

  addCharge(): void {
    this.charges.push(createChargeGroup(this.fb, {
      description: '',
      amount: 0
    }));
  }

  removeCharge(index: number): void {
    this.charges.removeAt(index);
    if (this.charges.length === 0) {
      this.addCharge();
    }
    this.recalculateTotals();
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

  recalculateTotals(): void {
    const subtotal = this.charges.controls.reduce((acc, group) => acc + numberValue(group.value.amount), 0);
    const discountedTotal = applyPromoDiscount(subtotal, this.selectedPromo);
    this.form.patchValue({
      quotedTotal: subtotal,
      confirmedTotal: discountedTotal
    }, { emitEvent: false });
    this.syncPaymentStatus();
  }

  async applyPromo(): Promise<void> {
    const code = String(this.form.value.promoCode ?? '').trim();
    if (!code) return;
    const promo = await firstValueFrom(this.promos.getPromoByCode(code));
    this.selectedPromo = promo ?? null;
    this.recalculateTotals();
  }

  clearPromo(): void {
    this.selectedPromo = null;
    this.form.patchValue({ promoCode: '' }, { emitEvent: false });
    this.recalculateTotals();
  }

  getBalancePreview(): number {
    return Math.max(numberValue(this.form.value.confirmedTotal) - numberValue(this.form.value.amountPaid), 0);
  }

  private syncPaymentStatus(): void {
    const statusControl = this.form.get('paymentStatus');
    if (!statusControl) return;
    const balance = this.getBalancePreview();
    if (balance <= 0) {
      statusControl.setValue('COMPLETED', { emitEvent: false });
    } else if (statusControl.value === 'COMPLETED') {
      statusControl.setValue('PENDING', { emitEvent: false });
    }
  }

  save(){
    const charges = this.charges.controls.map(group => buildChargeFromForm(group)).filter(charge => charge.description);
    const quotedTotal = numberValue(this.form.value.quotedTotal);
    const confirmedTotal = numberValue(this.form.value.confirmedTotal);
    const amountPaid = numberValue(this.form.value.amountPaid);

    this.fireBooking.updateBooking(this.data.booking.bookingID!, {
      status: this.form.value.status ?? this.data.booking.status,
      charges,
      payment: {
        type: this.data.booking.payment?.type ?? "NOW",
        method: this.form.value.paymentMethod ?? this.data.booking.payment?.method,
        office: this.form.value.paymentOffice ?? this.data.booking.payment?.office,
        status: this.form.value.paymentStatus ?? this.data.booking.payment?.status,
        paymentLimit: this.form.value.paymentLimit ? Timestamp.fromDate(this.form.value.paymentLimit) : this.data.booking.payment?.paymentLimit,
        originalAmount: quotedTotal,
        amount: confirmedTotal,
        totalDue: confirmedTotal,
        payed: amountPaid,
        promo: this.selectedPromo ?? undefined
      }
    }).then(()=>{
      this._bottomSheetRef.dismiss();
    });
  }
}

@Component({
  selector: 'app-booking-details-admin-edit-contact-sheet',
  templateUrl: './edit-contact-sheet.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class BookingDetailsAdminEditContactSheet implements OnInit {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { booking: FirebaseBooking },
    private fb: FormBuilder,
    private fireBooking: FireBookingService,
    private auth: FireAuthService
  ) {}

  private _bottomSheetRef = inject<MatBottomSheetRef<BookingDetailsAdminEditContactSheet>>(MatBottomSheetRef);
  form!: FormGroup;
  foundUsers: UserData[] = [];

  ngOnInit(): void {
    const contact = this.data.booking.contact;
    this.form = this.fb.group({
      name: [contact?.name ?? '', [Validators.required]],
      lastname: [contact?.lastname ?? '', [Validators.required]],
      email: [contact?.email ?? '', [Validators.required]],
      phone: [contact?.phone ?? '', [Validators.required]],
      country_code: [contact?.country_code ?? '52', [Validators.required]],
      linkedUserEmail: [contact?.email ?? ''],
      uid: [this.data.booking.uid ?? '']
    });
  }

  async searchUsers(): Promise<void> {
    const email = String(this.form.value.linkedUserEmail ?? '').trim();
    this.foundUsers = await this.auth.findUsersByEmail(email);
  }

  selectUser(user: UserData): void {
    this.form.patchValue({
      uid: user.uid ?? '',
      email: user.email ?? this.form.value.email,
      name: user.name ?? this.form.value.name,
      lastname: user.lastName ?? this.form.value.lastname
    });
  }

  save(): void {
    const contact: ContactInfoValue = {
      name: String(this.form.value.name ?? '').trim(),
      lastname: String(this.form.value.lastname ?? '').trim(),
      email: String(this.form.value.email ?? '').trim(),
      phone: String(this.form.value.phone ?? '').trim(),
      country_code: String(this.form.value.country_code ?? '52').trim()
    };

    this.fireBooking.updateBooking(this.data.booking.bookingID!, {
      contact,
      uid: String(this.form.value.uid ?? '').trim() || undefined
    }).then(() => this._bottomSheetRef.dismiss());
  }
}

@Component({
  selector: 'app-booking-details-admin-edit-passengers-sheet',
  templateUrl: './edit-passengers-sheet.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class BookingDetailsAdminEditPassengersSheet implements OnInit {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { booking: FirebaseBooking },
    private fb: FormBuilder,
    private fireBooking: FireBookingService
  ) {}

  private _bottomSheetRef = inject<MatBottomSheetRef<BookingDetailsAdminEditPassengersSheet>>(MatBottomSheetRef);
  form!: FormGroup;

  ngOnInit(): void {
    const passengers = this.data.booking.flightDetails?.passengers?.details ?? [];
    this.form = this.fb.group({
      passengers: this.fb.array(passengers.map(passenger => createPassengerAdminGroup(this.fb, passenger)))
    });
    if (this.passengers.length === 0) {
      this.addPassenger();
    }
  }

  get passengers(): FormArray<FormGroup> {
    return this.form.get('passengers') as FormArray<FormGroup>;
  }

  addPassenger(type: PassengerValue['type'] = 'ADULT'): void {
    this.passengers.push(createPassengerAdminGroup(this.fb, {
      id: this.passengers.length,
      name: '',
      lastname: '',
      birth: new Date(),
      gender: '',
      type
    } as PassengerValue));
  }

  removePassenger(index: number): void {
    this.passengers.removeAt(index);
    if (this.passengers.length === 0) {
      this.addPassenger();
    }
  }

  getCountsPreview() {
    return this.passengers.controls.reduce((acc, group) => {
      const type = group.value.type as PassengerValue['type'];
      if (type === 'ADULT') acc.adults += 1;
      if (type === 'CHILDREN') acc.childrens += 1;
      if (type === 'INFANT') acc.infants += 1;
      return acc;
    }, { adults: 0, childrens: 0, infants: 0 });
  }

  save(): void {
    if (this.data.booking.type !== 'FLIGHT' || !this.data.booking.flightDetails) {
      this._bottomSheetRef.dismiss();
      return;
    }

    const passengers = this.passengers.controls.map((group, index) => buildPassengerFromForm(group, index));
    const counts = this.getCountsPreview();

    this.fireBooking.updateBooking(this.data.booking.bookingID!, {
      flightDetails: {
        ...this.data.booking.flightDetails,
        passengers: {
          ...this.data.booking.flightDetails.passengers,
          counts,
          details: passengers
        }
      }
    }).then(() => this._bottomSheetRef.dismiss());
  }
}

@Component({
  selector: 'app-booking-details-admin-edit-services-sheet',
  templateUrl: './edit-services-sheet.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ]
})
export class BookingDetailsAdminEditServicesSheet implements OnInit {
  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { booking: FirebaseBooking },
    private fb: FormBuilder,
    private fireBooking: FireBookingService
  ) {}

  private _bottomSheetRef = inject<MatBottomSheetRef<BookingDetailsAdminEditServicesSheet>>(MatBottomSheetRef);
  form!: FormGroup;
  readonly linkedServiceTypes = LINKED_SERVICE_TYPES;

  ngOnInit(): void {
    this.form = this.fb.group({
      pnr: [this.data.booking.pnr ?? ''],
      flightOriginIata: [this.data.booking.flightDetails?.origin?.iataCode ?? ''],
      flightOriginCity: [this.data.booking.flightDetails?.origin?.address?.cityName ?? ''],
      flightDestinationIata: [this.data.booking.flightDetails?.destination?.iataCode ?? ''],
      flightDestinationCity: [this.data.booking.flightDetails?.destination?.address?.cityName ?? ''],
      flightDeparture: [toDate(this.data.booking.flightDetails?.departure)],
      flightReturn: [toDate(this.data.booking.flightDetails?.return)],
      hotelName: [this.data.booking.hotelDetails?.hotel?.name ?? ''],
      hotelCity: [this.data.booking.hotelDetails?.hotel?.city ?? ''],
      hotelCountry: [this.data.booking.hotelDetails?.hotel?.country ?? ''],
      hotelCheckin: [toDate(this.data.booking.hotelDetails?.checkin)],
      hotelCheckout: [toDate(this.data.booking.hotelDetails?.checkout)],
      linkedServices: this.fb.array((this.data.booking.linkedServices ?? []).map(service => createLinkedServiceGroup(this.fb, service)))
    });
  }

  get linkedServices(): FormArray<FormGroup> {
    return this.form.get('linkedServices') as FormArray<FormGroup>;
  }

  addLinkedService(type: ReservationLinkedService['type'] = 'EXTRA'): void {
    this.linkedServices.push(createLinkedServiceGroup(this.fb, {
      id: randomId('svc'),
      type,
      title: '',
      included: false
    } as ReservationLinkedService));
  }

  removeLinkedService(index: number): void {
    this.linkedServices.removeAt(index);
  }

  save(): void {
    const payload: Partial<FirebaseBooking> = {
      pnr: String(this.form.value.pnr ?? '').trim() || undefined,
      linkedServices: this.linkedServices.controls
        .map(group => buildLinkedServiceFromForm(group))
        .filter(service => service.title)
    };

    if (this.data.booking.type === 'FLIGHT' && this.data.booking.flightDetails) {
      const updated = {
        ...this.data.booking.flightDetails,
        origin: {
          ...this.data.booking.flightDetails.origin,
          iataCode: String(this.form.value.flightOriginIata ?? '').trim() || this.data.booking.flightDetails.origin.iataCode,
          address: {
            ...this.data.booking.flightDetails.origin.address,
            cityName: String(this.form.value.flightOriginCity ?? '').trim() || this.data.booking.flightDetails.origin.address.cityName
          }
        },
        destination: {
          ...this.data.booking.flightDetails.destination,
          iataCode: String(this.form.value.flightDestinationIata ?? '').trim() || this.data.booking.flightDetails.destination.iataCode,
          address: {
            ...this.data.booking.flightDetails.destination.address,
            cityName: String(this.form.value.flightDestinationCity ?? '').trim() || this.data.booking.flightDetails.destination.address.cityName
          }
        },
        departure: toTimestamp(this.form.value.flightDeparture) ?? this.data.booking.flightDetails.departure,
        return: toTimestamp(this.form.value.flightReturn) ?? this.data.booking.flightDetails.return
      };
      payload.flightDetails = updated;
    }

    if (this.data.booking.type === 'HOTEL' && this.data.booking.hotelDetails) {
      payload.hotelDetails = {
        ...this.data.booking.hotelDetails,
        checkin: toTimestamp(this.form.value.hotelCheckin) ?? this.data.booking.hotelDetails.checkin,
        checkout: toTimestamp(this.form.value.hotelCheckout) ?? this.data.booking.hotelDetails.checkout,
        hotel: {
          ...this.data.booking.hotelDetails.hotel,
          name: String(this.form.value.hotelName ?? '').trim() || this.data.booking.hotelDetails.hotel.name,
          city: String(this.form.value.hotelCity ?? '').trim() || this.data.booking.hotelDetails.hotel.city,
          country: String(this.form.value.hotelCountry ?? '').trim() || this.data.booking.hotelDetails.hotel.country
        }
      };
    }

    this.fireBooking.updateBooking(this.data.booking.bookingID!, payload).then(() => this._bottomSheetRef.dismiss());
  }
}

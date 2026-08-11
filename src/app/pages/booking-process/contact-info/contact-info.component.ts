import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { User } from '@angular/fire/auth';
import { combineLatest, Subscription } from 'rxjs';
import { BookingProcessLoginBottomsheetComponent } from '../../../components/nav-header/booking-process-login-bottomsheet/booking-process-login-bottomsheet.component';
import { FireAuthService, UserData } from '../../../services/fire-auth.service';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { WORLD_COUNTRIES } from '../../../static/countries.static';
import { FlightFirebaseBooking } from '../../../types/booking.types';

export interface ContactInfoValue {
  name: string;
  lastname: string;
  phone: string;
  email: string;
  country_code: string;
}

@Component({
  selector: 'app-contact-info',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule
  ],
  templateUrl: './contact-info.component.html',
  styleUrl: './contact-info.component.scss'
})
export class ContactInfoComponent implements OnDestroy {
  @Output() valid = new EventEmitter<ContactInfoValue | undefined>();

  readonly countries = WORLD_COUNTRIES;
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(9)] }),
    country_code: new FormControl('52', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    lastname: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] })
  });

  bookingData?: FlightFirebaseBooking;
  isLoggedIn = false;
  reservationForSomeoneElse = false;
  hasLockedAccountName = false;
  hasLockedAccountEmail = false;

  private currentUser: User | null = null;
  private currentUserData: UserData | null = null;
  private existingContact?: ContactInfoValue;
  private alternateHolder?: { name: string; lastname: string };
  private readonly subscriptions = new Subscription();

  constructor(
    private booking: BookingHandlerService,
    private auth: FireAuthService,
    private bottomSheet: MatBottomSheet
  ) {
    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.change()));

    this.subscriptions.add(this.booking.booking.subscribe(booking => {
      if (!booking) return;
      this.bookingData = booking;
      if (booking.contact) {
        this.existingContact = booking.contact;
        this.form.patchValue(booking.contact, { emitEvent: false });
      }
      this.applyIdentityRules();
    }));

    this.subscriptions.add(combineLatest([this.auth.user, this.auth.data]).subscribe(([user, userData]) => {
      this.currentUser = user;
      this.currentUserData = userData;
      this.isLoggedIn = Boolean(user && !user.isAnonymous);
      this.applyIdentityRules();
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openLogin(): void {
    this.bottomSheet.open(BookingProcessLoginBottomsheetComponent, {
      panelClass: 'custom-bottom-sheet'
    });
  }

  get userDisplayName(): string {
    const firestoreName = [this.currentUserData?.name, this.currentUserData?.lastName]
      .map(value => String(value ?? '').trim())
      .filter(Boolean)
      .join(' ');
    const authName = String(this.currentUser?.displayName ?? '').trim();
    const emailName = String(this.currentUser?.email ?? '').split('@')[0].trim();
    return firestoreName || authName || emailName || 'Viajero Xplora';
  }

  get profileAvatar(): string {
    const savedAvatar = String(this.currentUserData?.avatar ?? '').trim();
    const authAvatar = String(this.currentUser?.photoURL ?? '').trim();
    if (savedAvatar || authAvatar) return savedAvatar || authAvatar;

    const name = encodeURIComponent(this.userDisplayName);
    return `https://ui-avatars.com/api/?background=267047&color=fff&name=${name}&rounded=true&bold=true&size=96`;
  }

  toggleReservationOwner(forSomeoneElse: boolean): void {
    this.reservationForSomeoneElse = forSomeoneElse;
    const nameControl = this.form.controls.name;
    const lastNameControl = this.form.controls.lastname;

    if (forSomeoneElse) {
      nameControl.enable({ emitEvent: false });
      lastNameControl.enable({ emitEvent: false });
      const holder = this.alternateHolder ?? { name: '', lastname: '' };
      this.form.patchValue(holder, { emitEvent: false });
    } else {
      this.alternateHolder = {
        name: nameControl.value,
        lastname: lastNameControl.value
      };
      this.applyAccountName();
    }
    this.change();
  }

  private applyIdentityRules(): void {
    if (!this.isLoggedIn || !this.currentUser) {
      this.hasLockedAccountName = false;
      this.hasLockedAccountEmail = false;
      this.form.controls.name.enable({ emitEvent: false });
      this.form.controls.lastname.enable({ emitEvent: false });
      this.form.controls.email.enable({ emitEvent: false });
      this.change();
      return;
    }

    const accountName = String(this.currentUserData?.name ?? '').trim();
    const accountLastName = String(this.currentUserData?.lastName ?? '').trim();
    this.hasLockedAccountName = Boolean(accountName && accountLastName);

    if (this.hasLockedAccountName && this.existingContact && !this.alternateHolder) {
      const belongsToAccount = this.sameText(this.existingContact.name, accountName)
        && this.sameText(this.existingContact.lastname, accountLastName);
      if (!belongsToAccount) {
        this.reservationForSomeoneElse = true;
        this.alternateHolder = {
          name: this.existingContact.name,
          lastname: this.existingContact.lastname
        };
      }
    }

    if (this.hasLockedAccountName && !this.reservationForSomeoneElse) {
      this.applyAccountName();
    } else {
      this.form.controls.name.enable({ emitEvent: false });
      this.form.controls.lastname.enable({ emitEvent: false });
    }

    const accountEmail = String(
      this.currentUser.email
      ?? this.currentUserData?.email
      ?? this.currentUserData?.communications?.notificationEmail
      ?? ''
    ).trim();
    this.hasLockedAccountEmail = Boolean(accountEmail);
    if (accountEmail) {
      this.form.controls.email.setValue(accountEmail, { emitEvent: false });
      this.form.controls.email.disable({ emitEvent: false });
    } else {
      this.form.controls.email.enable({ emitEvent: false });
    }

    const phoneNumber = String(this.currentUser.phoneNumber ?? '').trim();
    if (phoneNumber && !this.form.controls.phone.value.trim()) {
      const phone = this.splitPhoneNumber(phoneNumber);
      this.form.patchValue(phone, { emitEvent: false });
    }
    this.change();
  }

  private applyAccountName(): void {
    const name = String(this.currentUserData?.name ?? '').trim();
    const lastname = String(this.currentUserData?.lastName ?? '').trim();
    if (!name || !lastname) return;

    this.form.patchValue({ name, lastname }, { emitEvent: false });
    this.form.controls.name.disable({ emitEvent: false });
    this.form.controls.lastname.disable({ emitEvent: false });
  }

  private splitPhoneNumber(phoneNumber: string): { country_code: string; phone: string } {
    const digits = phoneNumber.replace(/\D/g, '');
    const matchingCountry = [...this.countries]
      .sort((first, second) => String(second.code).length - String(first.code).length)
      .find(country => digits.startsWith(String(country.code)));
    const countryCode = String(matchingCountry?.code ?? this.form.controls.country_code.value ?? '52');
    return {
      country_code: countryCode,
      phone: digits.startsWith(countryCode) ? digits.slice(countryCode.length) : digits
    };
  }

  private sameText(first: string, second: string): boolean {
    return first.trim().localeCompare(second.trim(), 'es', { sensitivity: 'base' }) === 0;
  }

  private change(): void {
    this.valid.emit(this.form.valid ? this.form.getRawValue() : undefined);
  }
}

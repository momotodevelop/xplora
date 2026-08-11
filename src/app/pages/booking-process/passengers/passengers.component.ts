import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DocumentReference, Timestamp } from 'firebase/firestore';
import { of, Subscription, switchMap } from 'rxjs';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { FireAuthService } from '../../../services/fire-auth.service';
import { SavedPassengersService } from '../../../services/saved-passengers.service';
import { SavedPassenger, SavedPassengerInput } from '../../../types/saved-passenger.types';

export interface PassengerValue {
  id: number;
  name: string;
  lastname: string;
  birth: Date | Timestamp;
  gender: string;
  type: 'ADULT' | 'CHILDREN' | 'INFANT';
  minDate?: Date;
  maxDate?: Date;
  savedPassengerRef?: DocumentReference;
  saveToSavedPassengers?: boolean;
}

export interface PassengerFormValue {
  name: string;
  lastname: string;
  birth: Date;
  gender: string;
  savedPassengerId: string;
  passengerSuggestionId: string;
  savePassenger: boolean;
}

interface PassengerSuggestion {
  id: string;
  source: 'BOOKING_HOLDER' | 'SAVED_PASSENGER';
  name: string;
  lastName: string;
  icon: 'person' | 'child_care';
  typeLabel: 'Adulto' | 'Menor';
  savedPassenger?: SavedPassenger;
}

@Component({
  selector: 'app-passengers',
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatDatepickerModule,
    FormsModule,
    MatNativeDateModule,
    MatOptionModule,
    MatSelectModule,
    MatExpansionModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './passengers.component.html',
  styleUrl: './passengers.component.scss'
})
export class PassengersComponent implements OnInit, OnDestroy {
  @Input() adults!: number;
  @Input() childrens!: number;
  @Input() infants!: number;
  @Input() passengersData!: PassengerValue[];
  @Output() valid = new EventEmitter<PassengerValue[] | undefined>();

  readonly form: FormGroup;
  savedPassengers: SavedPassenger[] = [];
  currentUserId: string | null = null;
  isLoggedIn = false;
  savingRequestedPassengers = false;
  savedPassengerReferences: Array<DocumentReference | null> = [];
  passengerTitles: string[] = [];
  passengerCompleted: boolean[] = [];
  expandedPassengerIndex: number | null = 0;
  passengerDetails: {
    minDate: Date | undefined;
    maxDate: Date | undefined;
    id: number;
    type: 'ADULT' | 'CHILDREN' | 'INFANT';
  }[] = [];

  private bookingHolderSuggestion: PassengerSuggestion | null = null;
  private readonly subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private bookingHandler: BookingHandlerService,
    public auth: FireAuthService,
    private savedPassengersService: SavedPassengersService
  ) {
    this.form = this.fb.group({
      passengers: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.initializeForm();

    this.subscriptions.add(
      this.auth.user.pipe(
        switchMap(user => {
          this.currentUserId = user && !user.isAnonymous ? user.uid : null;
          this.isLoggedIn = Boolean(this.currentUserId);
          return this.currentUserId
            ? this.savedPassengersService.watchPassengers(this.currentUserId)
            : of([]);
        })
      ).subscribe({
        next: passengers => {
          this.savedPassengers = passengers;
        },
        error: error => {
          console.error('Error loading saved passengers for booking:', error);
          this.savedPassengers = [];
        }
      })
    );

    this.subscriptions.add(this.bookingHandler.booking.subscribe(booking => {
      if (!booking) return;
      this.updateBookingHolderSuggestion(booking.contact);

      const passengersData = booking.flightDetails?.passengers.details;
      if (!passengersData?.length) return;

      passengersData.forEach((passenger, index) => {
        const passengerGroup = this.passengers.at(index) as FormGroup;
        if (!passengerGroup) return;
        this.setSuggestionControlState(index, null);
        passengerGroup.patchValue({
          name: passenger.name ?? '',
          lastname: passenger.lastname ?? '',
          birth: passenger.birth ? this.toDate(passenger.birth) : '',
          gender: passenger.gender ?? '',
          savedPassengerId: passenger.savedPassengerRef?.id ?? '',
          passengerSuggestionId: passenger.savedPassengerRef?.id
            ? this.savedSuggestionId(passenger.savedPassengerRef.id)
            : '',
          savePassenger: false
        }, { emitEvent: false });
        this.savedPassengerReferences[index] = passenger.savedPassengerRef ?? null;
        if (passenger.savedPassengerRef) {
          this.setSuggestionControlState(index, 'SAVED_PASSENGER');
        }
        this.passengerCompleted[index] = passengerGroup.valid;
      });

      this.reconcileBookingHolderSuggestionUsage();
      if (this.passengerCompleted.every(Boolean)) {
        this.expandedPassengerIndex = null;
      }
      this.emitFormData();
    }));

    this.subscriptions.add(this.form.valueChanges.subscribe(() => this.emitFormData()));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get passengers(): FormArray {
    return this.form.get('passengers') as FormArray;
  }

  get allPassengersCompleted(): boolean {
    return this.passengerCompleted.length === this.passengers.length
      && this.passengerCompleted.every(Boolean)
      && this.form.valid;
  }

  savePassengerPanel(passengerIndex: number): void {
    const passengerGroup = this.passengers.at(passengerIndex) as FormGroup;
    passengerGroup.markAllAsTouched();
    if (passengerGroup.invalid) return;

    this.passengerCompleted[passengerIndex] = true;
    const nextIndex = passengerIndex + 1;
    this.expandedPassengerIndex = nextIndex < this.passengers.length ? nextIndex : null;
    this.emitFormData();
  }

  editPassenger(passengerIndex: number, event?: Event): void {
    event?.stopPropagation();
    this.expandedPassengerIndex = passengerIndex;
  }

  onPanelClosed(passengerIndex: number): void {
    if (this.expandedPassengerIndex === passengerIndex) {
      this.expandedPassengerIndex = null;
    }
  }

  markPassengerDirty(passengerIndex: number, clearSavedPassenger = false): void {
    this.passengerCompleted[passengerIndex] = false;
    if (clearSavedPassenger) {
      this.clearPassengerSuggestionSelection(passengerIndex);
    }
    this.emitFormData();
  }

  passengerSuggestions(passengerIndex: number): PassengerSuggestion[] {
    const details = this.passengerDetails[passengerIndex];
    const suggestions: PassengerSuggestion[] = [];

    if (this.bookingHolderSuggestion && details.type === 'ADULT') {
      suggestions.push(this.bookingHolderSuggestion);
    }

    this.savedPassengers.forEach(passenger => {
      const suggestionId = this.savedSuggestionId(passenger.id);
      if (!this.isPassengerCompatible(passenger, details)) return;

      const isAdult = this.isAdult(passenger.birthDate.toDate());
      suggestions.push({
        id: suggestionId,
        source: 'SAVED_PASSENGER',
        name: passenger.name,
        lastName: passenger.lastName,
        icon: isAdult ? 'person' : 'child_care',
        typeLabel: isAdult ? 'Adulto' : 'Menor',
        savedPassenger: passenger
      });
    });

    return suggestions;
  }

  isPassengerSuggestionUsed(suggestionId: string): boolean {
    return this.passengers.controls.some(control =>
      String(control.get('passengerSuggestionId')?.value ?? '') === suggestionId
    );
  }

  applyPassengerSuggestion(passengerIndex: number, suggestion: PassengerSuggestion): void {
    const isAvailable = this.passengerSuggestions(passengerIndex)
      .some(item => item.id === suggestion.id);
    if (!isAvailable || this.isPassengerSuggestionUsed(suggestion.id)) return;

    if (suggestion.source === 'SAVED_PASSENGER' && suggestion.savedPassenger) {
      this.applySavedPassenger(passengerIndex, suggestion.savedPassenger, suggestion.id);
      return;
    }

    const passengerGroup = this.passengers.at(passengerIndex) as FormGroup;
    const replacesSavedPassenger = Boolean(this.savedPassengerReferences[passengerIndex]);
    this.setSuggestionControlState(passengerIndex, null);
    this.savedPassengerReferences[passengerIndex] = null;
    passengerGroup.patchValue({
      name: suggestion.name,
      lastname: suggestion.lastName,
      ...(replacesSavedPassenger ? { birth: '', gender: '' } : {}),
      savedPassengerId: '',
      passengerSuggestionId: suggestion.id,
      savePassenger: false
    }, { emitEvent: false });
    this.setSuggestionControlState(passengerIndex, 'BOOKING_HOLDER');
    this.passengerCompleted[passengerIndex] = false;
    this.emitFormData();
  }

  private applySavedPassenger(
    passengerIndex: number,
    passenger: SavedPassenger,
    suggestionId: string
  ): void {
    const passengerGroup = this.passengers.at(passengerIndex) as FormGroup;
    this.setSuggestionControlState(passengerIndex, null);
    this.savedPassengerReferences[passengerIndex] = this.currentUserId
      ? this.savedPassengersService.passengerReference(this.currentUserId, passenger.id)
      : null;
    passengerGroup.patchValue({
      name: passenger.name,
      lastname: passenger.lastName,
      birth: passenger.birthDate.toDate(),
      gender: passenger.gender,
      savedPassengerId: passenger.id,
      passengerSuggestionId: suggestionId,
      savePassenger: false
    }, { emitEvent: false });
    this.setSuggestionControlState(passengerIndex, 'SAVED_PASSENGER');
    this.passengerCompleted[passengerIndex] = false;
    this.emitFormData();
  }

  clearPassengerSuggestionSelection(passengerIndex: number): void {
    this.savedPassengerReferences[passengerIndex] = null;
    const passengerGroup = this.passengers.at(passengerIndex) as FormGroup;
    passengerGroup.patchValue({
      savedPassengerId: '',
      passengerSuggestionId: ''
    }, { emitEvent: false });
    this.setSuggestionControlState(passengerIndex, null);
  }

  async persistRequestedPassengers(): Promise<PassengerValue[]> {
    if (!this.currentUserId) return this.buildPassengerValues();

    this.savingRequestedPassengers = true;
    try {
      for (let index = 0; index < this.passengers.length; index++) {
        const passengerGroup = this.passengers.at(index) as FormGroup;
        const value = passengerGroup.getRawValue() as PassengerFormValue;
        if (!value.savePassenger || this.savedPassengerReferences[index]) continue;

        const input: SavedPassengerInput = {
          name: value.name,
          lastName: value.lastname,
          birthDate: value.birth,
          gender: value.gender as SavedPassengerInput['gender']
        };
        const reference = await this.savedPassengersService.createPassenger(this.currentUserId, input);
        this.savedPassengerReferences[index] = reference;
        passengerGroup.patchValue({
          savedPassengerId: reference.id,
          passengerSuggestionId: value.passengerSuggestionId || this.savedSuggestionId(reference.id),
          savePassenger: false
        }, { emitEvent: false });
      }
      const passengers = this.buildPassengerValues();
      this.valid.emit(passengers);
      return passengers;
    } finally {
      this.savingRequestedPassengers = false;
    }
  }

  private emitFormData(): void {
    this.valid.emit(this.allPassengersCompleted ? this.buildPassengerValues() : undefined);
  }

  private buildPassengerValues(): PassengerValue[] {
    return this.passengers.controls.map((control, index) => {
      const passenger = control.getRawValue() as PassengerFormValue;
      const value: PassengerValue = {
        name: passenger.name,
        lastname: passenger.lastname,
        birth: passenger.birth,
        gender: passenger.gender,
        type: this.passengerDetails[index].type,
        id: index,
        minDate: this.passengerDetails[index].minDate,
        maxDate: this.passengerDetails[index].maxDate,
        saveToSavedPassengers: passenger.savePassenger
      };
      const reference = this.savedPassengerReferences[index];
      if (reference) value.savedPassengerRef = reference;
      return value;
    });
  }

  private initializeForm(): void {
    let id = 1;
    let adultIterator = 1;
    let childrenIterator = 1;
    let infantIterator = 1;
    for (let index = 0; index < this.adults; index++) this.addPassenger('ADULT', id++, adultIterator++);
    for (let index = 0; index < this.childrens; index++) this.addPassenger('CHILDREN', id++, childrenIterator++);
    for (let index = 0; index < this.infants; index++) this.addPassenger('INFANT', id++, infantIterator++);
  }

  private addPassenger(type: 'ADULT' | 'CHILDREN' | 'INFANT', id: number, iteratorNumber: number): void {
    const today = new Date();
    let minDate: Date | undefined;
    let maxDate: Date | undefined;
    if (type === 'ADULT') {
      maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
    } else if (type === 'CHILDREN') {
      minDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
      maxDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    } else {
      minDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      maxDate = today;
    }

    const passengerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      birth: ['', Validators.required],
      gender: ['', Validators.required],
      savedPassengerId: [''],
      passengerSuggestionId: [''],
      savePassenger: [false]
    });
    const passengerTypeText = type === 'ADULT' ? 'Adulto' : type === 'CHILDREN' ? 'Menor' : 'Infante';
    this.passengerTitles.push(`${passengerTypeText} ${iteratorNumber}`);
    this.passengerDetails.push({ id, maxDate, minDate, type });
    this.savedPassengerReferences.push(null);
    this.passengerCompleted.push(false);
    this.passengers.push(passengerForm);
  }

  private isPassengerCompatible(
    passenger: SavedPassenger,
    details: { minDate: Date | undefined; maxDate: Date | undefined }
  ): boolean {
    const birthDate = passenger.birthDate.toDate();
    return (!details.minDate || birthDate >= details.minDate)
      && (!details.maxDate || birthDate <= details.maxDate);
  }

  private updateBookingHolderSuggestion(
    contact: { name?: string; lastname?: string } | undefined
  ): void {
    const previousSuggestionId = this.bookingHolderSuggestion?.id;
    const name = String(contact?.name ?? '').trim();
    const lastName = String(contact?.lastname ?? '').trim();

    this.bookingHolderSuggestion = name && lastName
      ? {
          id: this.bookingHolderSuggestionId(name, lastName),
          source: 'BOOKING_HOLDER',
          name,
          lastName,
          icon: 'person',
          typeLabel: 'Adulto'
        }
      : null;

    if (previousSuggestionId && previousSuggestionId !== this.bookingHolderSuggestion?.id) {
      this.passengers.controls.forEach((control, index) => {
        if (control.get('passengerSuggestionId')?.value === previousSuggestionId) {
          control.patchValue({ passengerSuggestionId: '' }, { emitEvent: false });
          this.setSuggestionControlState(index, null);
        }
      });
    }
    this.reconcileBookingHolderSuggestionUsage();
  }

  private reconcileBookingHolderSuggestionUsage(): void {
    if (!this.bookingHolderSuggestion) return;
    const usedPassengerIndex = this.passengers.controls.findIndex(control =>
      control.get('passengerSuggestionId')?.value === this.bookingHolderSuggestion?.id
    );
    if (usedPassengerIndex >= 0) {
      this.setSuggestionControlState(usedPassengerIndex, 'BOOKING_HOLDER');
      return;
    }

    const matchingPassengerIndex = this.passengers.controls.findIndex(control => {
      if (control.get('passengerSuggestionId')?.value) return false;
      return this.sameText(control.get('name')?.value, this.bookingHolderSuggestion?.name)
        && this.sameText(control.get('lastname')?.value, this.bookingHolderSuggestion?.lastName);
    });
    if (matchingPassengerIndex < 0) return;

    this.passengers.at(matchingPassengerIndex).patchValue({
      passengerSuggestionId: this.bookingHolderSuggestion.id
    }, { emitEvent: false });
    this.setSuggestionControlState(matchingPassengerIndex, 'BOOKING_HOLDER');
  }

  private setSuggestionControlState(
    passengerIndex: number,
    source: PassengerSuggestion['source'] | null
  ): void {
    const passengerGroup = this.passengers.at(passengerIndex) as FormGroup;
    if (!passengerGroup) return;

    const passengerDataControls = ['name', 'lastname', 'birth', 'gender'];
    passengerDataControls.forEach(controlName => {
      passengerGroup.get(controlName)?.enable({ emitEvent: false });
    });
    passengerGroup.get('savePassenger')?.enable({ emitEvent: false });

    if (source === 'BOOKING_HOLDER') {
      passengerGroup.get('name')?.disable({ emitEvent: false });
      passengerGroup.get('lastname')?.disable({ emitEvent: false });
      return;
    }

    if (source === 'SAVED_PASSENGER') {
      passengerDataControls.forEach(controlName => {
        passengerGroup.get(controlName)?.disable({ emitEvent: false });
      });
      passengerGroup.get('savePassenger')?.disable({ emitEvent: false });
    }
  }

  private bookingHolderSuggestionId(name: string, lastName: string): string {
    return `holder:${encodeURIComponent(name.toLocaleLowerCase('es'))}:${encodeURIComponent(lastName.toLocaleLowerCase('es'))}`;
  }

  private savedSuggestionId(passengerId: string): string {
    return `saved:${passengerId}`;
  }

  private isAdult(birthDate: Date): boolean {
    const today = new Date();
    const adultLimit = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
    return birthDate <= adultLimit;
  }

  private sameText(first: unknown, second: unknown): boolean {
    const firstText = String(first ?? '').trim();
    const secondText = String(second ?? '').trim();
    return Boolean(firstText && secondText)
      && firstText.localeCompare(secondText, 'es', { sensitivity: 'base' }) === 0;
  }

  private toDate(value: Date | Timestamp): Date {
    return value instanceof Timestamp ? value.toDate() : new Date(value);
  }
}

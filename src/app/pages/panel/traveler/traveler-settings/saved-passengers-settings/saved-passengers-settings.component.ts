import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';
import { FireAuthService } from '../../../../../services/fire-auth.service';
import { MetaHandlerService } from '../../../../../services/meta-handler.service';
import { SavedPassengersService } from '../../../../../services/saved-passengers.service';
import { ConfirmDialogComponent } from '../../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  PassengerGender,
  SavedPassenger,
  SavedPassengerInput
} from '../../../../../types/saved-passenger.types';

@Component({
  selector: 'app-saved-passengers-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './saved-passengers-settings.component.html',
  styleUrl: './saved-passengers-settings.component.scss'
})
export class SavedPassengersSettingsComponent implements OnInit, OnDestroy {
  readonly today = this.startOfDay(new Date());
  readonly earliestBirthDate = new Date(
    this.today.getFullYear() - 120,
    this.today.getMonth(),
    this.today.getDate()
  );

  readonly passengerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    birthDate: [null as Date | null, Validators.required],
    gender: ['' as PassengerGender | '', Validators.required]
  });

  passengers: SavedPassenger[] = [];
  currentUser: User | null = null;
  editingPassengerId: string | null = null;
  formVisible = false;
  loading = true;
  saving = false;
  loadError = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private auth: FireAuthService,
    private savedPassengers: SavedPassengersService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private meta: MetaHandlerService
  ) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Pasajeros guardados',
      description: 'Guarda y administra pasajeros frecuentes para agilizar tus reservaciones en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });

    this.subscriptions.add(
      this.auth.user.pipe(
        tap(user => {
          this.currentUser = user;
          this.loading = Boolean(user);
          this.loadError = '';
        }),
        switchMap(user => user
          ? this.savedPassengers.watchPassengers(user.uid)
          : of([])
        ),
        catchError(error => {
          console.error('Error loading saved passengers:', error);
          this.loadError = 'No pudimos cargar tus pasajeros guardados. Intenta nuevamente.';
          return of([]);
        })
      ).subscribe(passengers => {
        this.passengers = passengers;
        this.loading = false;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  createPassenger(): void {
    this.editingPassengerId = null;
    this.passengerForm.reset({
      name: '',
      lastName: '',
      birthDate: null,
      gender: ''
    });
    this.formVisible = true;
  }

  editPassenger(passenger: SavedPassenger): void {
    this.editingPassengerId = passenger.id;
    this.passengerForm.reset({
      name: passenger.name,
      lastName: passenger.lastName,
      birthDate: passenger.birthDate.toDate(),
      gender: passenger.gender
    });
    this.formVisible = true;
  }

  cancelForm(): void {
    this.formVisible = false;
    this.editingPassengerId = null;
    this.passengerForm.reset();
  }

  async savePassenger(): Promise<void> {
    if (this.passengerForm.invalid || !this.currentUser) {
      this.passengerForm.markAllAsTouched();
      return;
    }

    const values = this.passengerForm.getRawValue();
    if (!values.birthDate || !values.gender) {
      return;
    }

    const passenger: SavedPassengerInput = {
      name: values.name?.trim() ?? '',
      lastName: values.lastName?.trim() ?? '',
      birthDate: values.birthDate,
      gender: values.gender
    };

    this.saving = true;
    try {
      if (this.editingPassengerId) {
        await this.savedPassengers.updatePassenger(
          this.currentUser.uid,
          this.editingPassengerId,
          passenger
        );
        this.snackBar.open('Pasajero actualizado.', 'Cerrar', { duration: 2500 });
      } else {
        await this.savedPassengers.createPassenger(this.currentUser.uid, passenger);
        this.snackBar.open('Pasajero guardado.', 'Cerrar', { duration: 2500 });
      }
      this.cancelForm();
    } catch (error) {
      console.error('Error saving passenger:', error);
      this.snackBar.open('No pudimos guardar el pasajero. Intenta nuevamente.', 'Cerrar', {
        duration: 3500
      });
    } finally {
      this.saving = false;
    }
  }

  async deletePassenger(passenger: SavedPassenger): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const confirmed = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '94vw',
        data: {
          title: 'Eliminar pasajero',
          message: `¿Deseas eliminar a ${this.fullName(passenger)} de tus pasajeros guardados?`,
          confirmText: 'Eliminar pasajero',
          confirmColor: 'warn'
        }
      }).afterClosed()
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.savedPassengers.deletePassenger(this.currentUser.uid, passenger.id);
      if (this.editingPassengerId === passenger.id) {
        this.cancelForm();
      }
      this.snackBar.open('Pasajero eliminado.', 'Cerrar', { duration: 2500 });
    } catch (error) {
      console.error('Error deleting passenger:', error);
      this.snackBar.open('No pudimos eliminar el pasajero. Intenta nuevamente.', 'Cerrar', {
        duration: 3500
      });
    }
  }

  fullName(passenger: SavedPassenger): string {
    return `${passenger.name} ${passenger.lastName}`.trim();
  }

  birthDate(passenger: SavedPassenger): Date {
    return passenger.birthDate.toDate();
  }

  passengerType(passenger: SavedPassenger): string {
    const age = this.ageAt(passenger.birthDate.toDate(), this.today);
    if (age < 2) {
      return 'Infante';
    }
    if (age < 12) {
      return 'Menor';
    }
    return 'Adulto';
  }

  genderLabel(gender: PassengerGender): string {
    switch (gender) {
      case 'MALE':
        return 'Masculino';
      case 'FEMALE':
        return 'Femenino';
      default:
        return 'Otro';
    }
  }

  private ageAt(birthDate: Date, referenceDate: Date): number {
    let age = referenceDate.getFullYear() - birthDate.getFullYear();
    const monthDifference = referenceDate.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && referenceDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { FireAuthService, UserData } from '../../services/fire-auth.service';
import { FireBookingService } from '../../services/fire-booking.service';
import { SharedDataService } from '../../services/shared-data.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { FirebaseBooking } from '../../types/booking.types';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-customer-support',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-support.component.html',
  styleUrl: './customer-support.component.scss'
})
export class CustomerSupportComponent implements OnInit {
  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email]
  });
  confirmationControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)]
  });

  bookings: FirebaseBooking[] = [];
  selectedBooking?: FirebaseBooking;
  loading = false;
  hasSearched = false;
  searchError = '';

  user?: User;
  userData?: UserData | null;
  userEmail?: string;
  private lastLoadedEmail?: string;
  headerHeight = 0;

  constructor(
    private auth: FireAuthService,
    private fireBookings: FireBookingService,
    private shared: SharedDataService,
    private meta: MetaHandlerService
  ) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Servicio al Cliente',
      description: 'Consulta tu reservacion con tu clave de confirmacion o selecciona una reservacion si ya iniciaste sesion.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.shared.changeHeaderType('dark');
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height || 0;
    });

    this.auth.user.subscribe(user => {
      this.user = user ?? undefined;
      this.syncUserEmail();
    });
    this.auth.data.subscribe(data => {
      this.userData = data ?? undefined;
      this.syncUserEmail();
    });
  }

  get isLoggedIn(): boolean {
    return !!this.user;
  }

  get canSearch(): boolean {
    return this.emailControl.valid && this.confirmationControl.valid && !this.loading;
  }

  async searchBooking(): Promise<void> {
    this.hasSearched = true;
    this.searchError = '';
    this.selectedBooking = undefined;

    if (!this.emailControl.valid || !this.confirmationControl.valid) {
      this.searchError = 'Por favor ingresa un correo valido y una clave de 6 caracteres.';
      return;
    }

    this.loading = true;
    const email = this.emailControl.value.trim().toLowerCase();
    const pnr = this.confirmationControl.value.trim();

    try {
      const results = await this.fireBookings.searchBooking(pnr, email);
      this.bookings = this.sortBookings(results);
      if (this.bookings.length === 0) {
        this.searchError = 'No encontramos una reservacion con esos datos.';
      }
    } catch (error) {
      console.error(error);
      this.searchError = 'No pudimos validar tu informacion. Intenta de nuevo en unos minutos.';
      this.bookings = [];
    } finally {
      this.loading = false;
    }
  }

  selectBooking(booking: FirebaseBooking): void {
    this.selectedBooking = booking;
  }

  getBookingTitle(booking: FirebaseBooking): string {
    if (booking.type === 'FLIGHT' && booking.flightDetails) {
      return `${booking.flightDetails.origin.iataCode} -> ${booking.flightDetails.destination.iataCode}`;
    }
    if (booking.type === 'HOTEL' && booking.hotelDetails?.hotel?.name) {
      return booking.hotelDetails.hotel.name;
    }
    if (booking.type === 'ACTIVITY') {
      return 'Actividad reservada';
    }
    if (booking.type === 'CAR_RENTAL') {
      return 'Renta de auto';
    }
    if (booking.type === 'TRANSPORTATION') {
      return 'Transportacion';
    }
    if (booking.type === 'CRUISE') {
      return 'Crucero';
    }
    if (booking.type === 'PACKAGE') {
      return 'Paquete';
    }
    return 'Servicio';
  }

  getBookingTypeLabel(booking: FirebaseBooking): string {
    switch (booking.type) {
      case 'FLIGHT':
        return 'Vuelo';
      case 'HOTEL':
        return 'Hotel';
      case 'ACTIVITY':
        return 'Actividad';
      case 'CAR_RENTAL':
        return 'Auto';
      case 'TRANSPORTATION':
        return 'Transportacion';
      case 'CRUISE':
        return 'Crucero';
      case 'PACKAGE':
        return 'Paquete';
      default:
        return 'Reservacion';
    }
  }

  getBookingStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'VALIDATING':
        return 'En validacion';
      case 'CANCELED':
        return 'Cancelada';
      case 'REJECTED':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'text-green-2';
      case 'CANCELED':
      case 'REJECTED':
        return 'text-red-1';
      case 'VALIDATING':
        return 'text-yellow-1';
      default:
        return 'text-blue-1';
    }
  }

  private syncUserEmail(): void {
    if (!this.isLoggedIn) {
      this.userEmail = undefined;
      if (this.lastLoadedEmail) {
        this.lastLoadedEmail = undefined;
        this.bookings = [];
        this.hasSearched = false;
        this.searchError = '';
        this.selectedBooking = undefined;
      }
      return;
    }

    const candidate = this.user?.email || this.userData?.communications?.notificationEmail;
    this.userEmail = candidate || undefined;

    if (this.userEmail && this.emailControl.pristine) {
      this.emailControl.setValue(this.userEmail);
    }

    if (this.isLoggedIn && this.userEmail && this.userEmail !== this.lastLoadedEmail) {
      this.lastLoadedEmail = this.userEmail;
      this.loadBookingsForEmail(this.userEmail);
    }
  }

  private async loadBookingsForEmail(email: string): Promise<void> {
    this.loading = true;
    this.hasSearched = true;
    this.searchError = '';
    this.selectedBooking = undefined;

    try {
      const results = await firstValueFrom(this.fireBookings.getBookingsByEmail(email));
      this.bookings = this.sortBookings(results);
      if (this.bookings.length === 0) {
        this.searchError = 'No encontramos reservaciones asociadas a este correo.';
      }
    } catch (error) {
      console.error(error);
      this.searchError = 'No pudimos cargar tus reservaciones. Intenta mas tarde.';
      this.bookings = [];
    } finally {
      this.loading = false;
    }
  }

  private sortBookings(bookings: FirebaseBooking[]): FirebaseBooking[] {
    return [...bookings].sort((a, b) => {
      const aTime = a.created?.toMillis ? a.created.toMillis() : 0;
      const bTime = b.created?.toMillis ? b.created.toMillis() : 0;
      return bTime - aTime;
    });
  }
}

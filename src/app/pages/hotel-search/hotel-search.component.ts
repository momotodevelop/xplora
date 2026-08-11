import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { DuffelStaysService } from '../../services/duffel-stays.service';
import { GooglePlacesService } from '../../services/google-places.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { SharedDataService } from '../../services/shared-data.service';
import {
  DuffelStaysAccommodation,
  DuffelStaysSearchResult
} from '../../types/duffel-stays.types';

interface HotelSearchParams {
  placeId: string;
  rooms: string;
  checkin: string;
  checkout: string;
}

interface HotelSearchQuery {
  lat?: string;
  lng?: string;
  destination?: string;
  destinationType?: string;
}

@Component({
  selector: 'app-hotel-search',
  imports: [CommonModule],
  templateUrl: './hotel-search.component.html',
  styleUrl: './hotel-search.component.scss'
})
export class HotelSearchComponent implements OnInit {
  loading = true;
  results: DuffelStaysSearchResult[] = [];
  errorMessage = '';
  destinationName = 'tu destino';
  checkIn = '';
  checkOut = '';
  rooms: number[][] = [];
  adults = 0;
  minors = 0;
  private latitude?: number;
  private longitude?: number;
  private radius = 20;
  private readonly isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private shared: SharedDataService,
    private places: GooglePlacesService,
    private stays: DuffelStaysService,
    private meta: MetaHandlerService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.shared.setBookingMode(true);
    this.route.data.pipe(
      map(data => data['headerType'])
    ).subscribe((type: 'light' | 'dark') => {
      this.shared.changeHeaderType(type);
    });

    combineLatest([this.route.params, this.route.queryParams]).subscribe(
      ([rawParams, rawQuery]) => {
        const params = rawParams as HotelSearchParams;
        const query = rawQuery as HotelSearchQuery;
        void this.prepareSearch(params, query);
      }
    );
  }

  get nights(): number {
    const start = Date.parse(`${this.checkIn}T00:00:00Z`);
    const end = Date.parse(`${this.checkOut}T00:00:00Z`);
    return Math.max(0, Math.round((end - start) / 86400000));
  }

  getPhoto(accommodation: DuffelStaysAccommodation): string {
    return accommodation.photos?.[0]?.url || '/assets/img/general/bg-home-xplora.jpg';
  }

  getAddress(accommodation: DuffelStaysAccommodation): string {
    const address = accommodation.location?.address;
    return [
      address?.line_one,
      address?.city_name,
      address?.region,
      address?.country_code
    ].filter(Boolean).join(', ');
  }

  getAmenities(accommodation: DuffelStaysAccommodation): string[] {
    return (accommodation.amenities || [])
      .map(amenity => amenity.description)
      .filter(Boolean)
      .slice(0, 4);
  }

  getStars(accommodation: DuffelStaysAccommodation): number[] {
    const rating = Math.max(0, Math.min(5, Math.round(accommodation.rating || 0)));
    return Array.from({ length: rating }, (_, index) => index);
  }

  hasPublicDiscount(result: DuffelStaysSearchResult): boolean {
    return Boolean(
      result.cheapest_rate_public_amount &&
      result.cheapest_rate_public_currency === result.cheapest_rate_currency &&
      Number(result.cheapest_rate_public_amount) >
        Number(result.cheapest_rate_total_amount)
    );
  }

  retry(): void {
    void this.search();
  }

  backToSearch(): void {
    void this.router.navigate(['/inicio']);
  }

  private async prepareSearch(
    params: HotelSearchParams,
    query: HotelSearchQuery
  ): Promise<void> {
    this.checkIn = params.checkin;
    this.checkOut = params.checkout;
    this.rooms = params.rooms
      .split('_')
      .map(pair => pair.split(',').map(Number))
      .filter(room => room.length === 2 && room.every(Number.isFinite));
    this.adults = this.rooms.reduce((total, room) => total + room[0], 0);
    this.minors = this.rooms.reduce((total, room) => total + room[1], 0);
    this.destinationName = String(query.destination || '').trim() || 'tu destino';
    this.radius = query.destinationType === 'accommodation' ?
      5 :
      query.destinationType === 'airport' ? 35 : 20;

    const latitude = Number(query.lat);
    const longitude = Number(query.lng);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      this.latitude = latitude;
      this.longitude = longitude;
    } else if (this.isBrowser) {
      try {
        const place = await this.places.getPlace(
          params.placeId,
          ['displayName', 'location']
        );
        this.destinationName =
          place.place.displayName || this.destinationName;
        this.latitude = place.place.location?.lat();
        this.longitude = place.place.location?.lng();
      } catch {
        this.latitude = undefined;
        this.longitude = undefined;
      }
    }

    this.meta.setMeta({
      title: `Xplora Travel || Hoteles en ${this.destinationName}`,
      description:
        `Explora alojamientos disponibles en ${this.destinationName} con Duffel Stays.`,
      image:
        'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fhotels.jpg?alt=media&token=7360a482-31e9-405f-abe5-59ab0e2bdf7c'
    });
    await this.search();
  }

  private async search(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.results = [];
    this.shared.setLoading(true);
    try {
      if (this.latitude === undefined || this.longitude === undefined) {
        throw new Error('STAYS_LOCATION_MISSING');
      }
      if (!this.rooms.length || this.adults < this.rooms.length) {
        throw new Error('STAYS_OCCUPANCY_INVALID');
      }
      if (this.minors > 0) {
        throw new Error('STAYS_CHILD_AGES_REQUIRED');
      }
      const response = await this.stays.search({
        latitude: this.latitude,
        longitude: this.longitude,
        radius: this.radius,
        rooms: this.rooms.length,
        adults: this.adults,
        checkInDate: this.checkIn,
        checkOutDate: this.checkOut,
        mobile: this.isBrowser && window.matchMedia('(max-width: 767px)').matches
      });
      this.results = response.data.results || [];
    } catch (error) {
      this.errorMessage = this.getSearchError(error);
    } finally {
      this.loading = false;
      this.shared.setLoading(false);
    }
  }

  private getSearchError(error: unknown): string {
    const payload = error instanceof HttpErrorResponse
      ? JSON.stringify(error.error || {})
      : String((error as Error)?.message || '');
    if (payload.includes('DUFFEL_STAYS_DISABLED')) {
      return 'El buscador de hoteles esta desactivado temporalmente.';
    }
    if (
      payload.includes('DUFFEL_STAYS_TEST_TOKEN_MISSING') ||
      payload.includes('DUFFEL_STAYS_LIVE_TOKEN_MISSING')
    ) {
      return 'Falta configurar el token del entorno activo de Duffel Stays.';
    }
    if (payload.includes('STAYS_CHILD_AGES_REQUIRED')) {
      return 'Esta primera integracion admite busquedas solo para adultos.';
    }
    if (payload.includes('STAYS_LOCATION_MISSING')) {
      return 'No fue posible obtener las coordenadas del destino.';
    }
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    ) {
      return 'Duffel rechazo la consulta. Es posible que tu cuenta aun no tenga acceso a Stays.';
    }
    return 'No fue posible consultar alojamientos en Duffel Stays. Intenta nuevamente.';
  }
}

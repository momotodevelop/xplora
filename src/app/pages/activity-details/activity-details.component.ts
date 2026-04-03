import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faMapMarkerAlt, faUser, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { SharedDataService } from '../../services/shared-data.service';
import { SlickConfig } from '../../types/slick.types';
import { map } from 'rxjs';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { XploraToursService } from '../../services/xplora-tours.service';
import { TourDayKey, XploraTour } from '../../types/xplora-tour.types';
import { take } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { GoogleMapsService, GoogleWeatherForecastResponse } from '../../services/google-maps.service';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-activity-details',
  imports: [
    CommonModule,
    FormsModule,
    SlickCarouselModule,
    FontAwesomeModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    GoogleMapsModule
  ],
  templateUrl: './activity-details.component.html',
  styleUrl: './activity-details.component.scss'
})
export class ActivityDetailsComponent implements OnInit {
  private static readonly defaultWeatherDays = 5;
  isBrowser = false;
  activity?: XploraTour;
  timeIcon = faClock;
  paxIcon = faUser;
  locationIcon = faMapMarkerAlt;
  externalLinkIcon = faExternalLinkAlt;
  mapCenter: google.maps.LatLngLiteral | null = null;
  mapZoom = 14;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    clickableIcons: false,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: true,
    gestureHandling: 'cooperative'
  };
  address: string | null = null;
  addressLoading = false;
  weatherLoading = false;
  weatherForecast: WeatherDayView[] = [];
  sliderConfig: SlickConfig = {
    slidesToShow: 2,
    slidesToScroll: 1,
    dots: true,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    accessibility: true,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };
  selectedDate: Date | null = null;
  pax = {
    adults: 2,
    children: 0,
    infants: 0
  };
  readonly minSelectableDate = this.getTomorrow();
  readonly dateFilter = (date: Date | null) => this.isDateAvailable(date);

  get mapLatitude(): number | null {
    const lat = this.activity?.geoCode?.latitude;
    return this.toNumberOrNull(lat);
  }

  get mapLongitude(): number | null {
    const lng = this.activity?.geoCode?.longitude;
    return this.toNumberOrNull(lng);
  }

  get enabledDays() {
    return (this.activity?.availableDays ?? []).filter(day => day.enabled);
  }

  get availabilityTimes(): string[] {
    const withTimes = this.enabledDays.find(day => day.times && day.times.length > 0);
    return withTimes?.times ?? [];
  }

  constructor(
    private route: ActivatedRoute,
    private sharedService: SharedDataService,
    private toursStore: XploraToursService,
    private meta: MetaHandlerService,
    public gMaps: GoogleMapsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.sharedService.setLoading(true);
    this.sharedService.setBookingMode(true);
    this.meta.setMeta({
      title: 'Xplora Travel || Detalle de Actividad',
      description: 'Consulta información detallada de esta actividad y reserva con Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.route.data.pipe(map(data => data['headerType'])).subscribe((type: 'light' | 'dark') => {
      this.sharedService.changeHeaderType(type);
    });

    if (!this.isBrowser) {
      this.sharedService.setLoading(false);
      return;
    }

    this.route.params.subscribe(params => {
      const activityId = params['activityId'] as string | undefined;
      if (!activityId) {
        this.sharedService.setLoading(false);
        return;
      }
      this.sharedService.setLoading(true);
      this.toursStore.getTour(activityId).pipe(take(1)).subscribe({
        next: (tour) => {
          if (!tour) {
            this.activity = undefined;
            this.meta.setMeta({
              title: 'Xplora Travel || Detalle de Actividad',
              description: 'Consulta información detallada de esta actividad y reserva con Xplora Travel.',
              image: '/assets/img/banner-generico.jpg'
            });
            this.updateMapLocation();
            this.sharedService.setLoading(false);
            return;
          }
          const pictures = tour?.pictures?.length ? [...tour.pictures] : [];
          const featured = tour.featuredImage;
          if (featured && !pictures.includes(featured)) {
            pictures.unshift(featured);
          }
          this.activity = { ...tour, id: tour.id ?? activityId, pictures: pictures.slice(0, 8) };
          this.meta.setMeta({
            title: `Xplora Travel || ${this.activity.name}`,
            description: this.activity.shortDescription || 'Descubre esta actividad y reserva con Xplora Travel.',
            image: this.activity.featuredImage || this.activity.pictures?.[0]
          });
          this.updateMapLocation();
          this.sharedService.setLoading(false);
        },
        error: () => {
          this.activity = undefined;
          this.meta.setMeta({
            title: 'Xplora Travel || Detalle de Actividad',
            description: 'Consulta información detallada de esta actividad y reserva con Xplora Travel.',
            image: '/assets/img/banner-generico.jpg'
          });
          this.updateMapLocation();
          this.sharedService.setLoading(false);
        }
      });
    });

    this.route.queryParams.subscribe(params => {
      this.applyQueryParams(params);
    });
  }

  updatePax(type: 'adults' | 'children' | 'infants', delta: number): void {
    const current = this.pax[type];
    const next = current + delta;
    if (type === 'adults' && next < 1) {
      return;
    }
    if (next < 0) {
      return;
    }
    this.pax = {
      ...this.pax,
      [type]: next
    };
  }

  private isDateAvailable(date: Date | null): boolean {
    if (!date) return false;
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (normalized <= today) return false;
    if (!this.enabledDays.length) return false;
    const key = this.dayKeyFromDate(normalized);
    return this.enabledDays.some(day => day.key === key);
  }

  private dayKeyFromDate(date: Date): TourDayKey {
    const day = date.getDay();
    switch (day) {
      case 0:
        return 'sunday';
      case 1:
        return 'monday';
      case 2:
        return 'tuesday';
      case 3:
        return 'wednesday';
      case 4:
        return 'thursday';
      case 5:
        return 'friday';
      default:
        return 'saturday';
    }
  }

  private getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private applyQueryParams(params: Params): void {
    const adults = this.parsePositiveInt(params['adults']);
    const children = this.parsePositiveInt(params['children'] ?? params['childrens']);
    const infants = this.parsePositiveInt(params['infants']);
    if (adults !== null) {
      this.pax.adults = adults;
    }
    if (children !== null) {
      this.pax.children = children;
    }
    if (infants !== null) {
      this.pax.infants = infants;
    }
    const dateParam = typeof params['date'] === 'string' ? params['date'] : undefined;
    const parsedDate = dateParam ? new Date(dateParam) : null;
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      this.selectedDate = parsedDate;
    }
  }

  private parsePositiveInt(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor(parsed));
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private updateMapLocation(): void {
    const lat = this.mapLatitude;
    const lng = this.mapLongitude;
    if (lat === null || lng === null) {
      this.mapCenter = null;
      this.address = null;
      this.weatherForecast = [];
      return;
    }
    this.mapCenter = { lat, lng };
    this.loadLocationExtras(lat, lng);
  }

  private loadLocationExtras(lat: number, lng: number): void {
    if (!this.isBrowser) return;
    this.addressLoading = true;
    this.weatherLoading = true;

    this.gMaps.getReverseGeocode(lat, lng).pipe(take(1)).subscribe({
      next: (address) => {
        this.address = address;
        this.addressLoading = false;
      },
      error: () => {
        this.address = null;
        this.addressLoading = false;
      }
    });

    this.gMaps.getDailyForecast(lat, lng, ActivityDetailsComponent.defaultWeatherDays, 'METRIC', 'es-MX').pipe(take(1)).subscribe({
      next: (response) => {
        this.weatherForecast = this.mapForecastResponse(response);
        this.weatherLoading = false;
      },
      error: () => {
        this.weatherForecast = [];
        this.weatherLoading = false;
      }
    });
  }

  private mapForecastResponse(response: GoogleWeatherForecastResponse): WeatherDayView[] {
    const days = response.forecastDays ?? [];
    return days.slice(0, ActivityDetailsComponent.defaultWeatherDays).map(day => {
      const dateValue = day.displayDate
        ? new Date(day.displayDate.year, day.displayDate.month - 1, day.displayDate.day)
        : new Date();
      const condition = day.daytimeForecast?.weatherCondition;
      const unitLabel = this.formatTempUnit(day.maxTemperature?.unit ?? day.minTemperature?.unit);
      return {
        key: `${dateValue.getFullYear()}-${dateValue.getMonth() + 1}-${dateValue.getDate()}`,
        date: dateValue,
        description: condition?.description?.text ?? 'Sin datos',
        iconUrl: this.gMaps.getWeatherIconUrl(condition?.iconBaseUri) ?? undefined,
        maxLabel: this.formatTempLabel(day.maxTemperature?.degrees, unitLabel),
        minLabel: this.formatTempLabel(day.minTemperature?.degrees, unitLabel)
      };
    });
  }

  private formatTempUnit(unit?: string): string {
    if (!unit) return '';
    if (unit === 'CELSIUS') return '°C';
    if (unit === 'FAHRENHEIT') return '°F';
    return unit;
  }

  private formatTempLabel(value?: number, unitLabel: string = ''): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `${Math.round(value)}${unitLabel}`;
  }
}

interface WeatherDayView {
  key: string;
  date: Date;
  description: string;
  iconUrl?: string;
  maxLabel: string;
  minLabel: string;
}

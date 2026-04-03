import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SharedDataService } from '../../services/shared-data.service';
import { ActivityResultItemComponent } from './activity-result-item/activity-result-item.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params } from '@angular/router';
import { AirportSearchService } from '../../services/airport-search.service';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { XploraToursService } from '../../services/xplora-tours.service';
import { XploraTour } from '../../types/xplora-tour.types';
import { take } from 'rxjs';

@Component({
  selector: 'app-activity-search',
  imports: [ActivityResultItemComponent, CommonModule],
  templateUrl: './activity-search.component.html',
  styleUrl: './activity-search.component.scss'
})
export class ActivitySearchComponent implements OnInit {
  allResults: XploraTour[] = [];
  pagedResults: XploraTour[] = [];
  pageSize = 12;
  currentPage = 1;
  location?: AmadeusLocation;
  includeTransfer = false;
  searchParams: Record<string, string | number> = {};
  private readonly defaultLat = 21.146023;
  private readonly defaultLng = -86.835454;
  private readonly searchRadiusKm = 20;
  private readonly transferIataCodes = new Set<string>([
    // TODO: Agrega aquí los códigos IATA con traslado incluido.
    'CUN',
    'MEX',
    'PVR'
  ]);

  constructor(
    private sharedService: SharedDataService,
    private route: ActivatedRoute,
    private airports: AirportSearchService,
    private amadeusAuth: AmadeusAuthService,
    private toursStore: XploraToursService,
    private meta: MetaHandlerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ){

  }

  get totalResults(): number {
    return this.allResults.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get pageStartIndex(): number {
    if (this.totalResults === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalResults);
  }

  ngOnInit(): void {
    this.sharedService.setBookingMode(true);
    this.sharedService.setLoading(true);
    this.sharedService.changeHeaderType('dark');
    this.meta.setMeta({
      title: 'Xplora Travel || Actividades y Tours',
      description: 'Descubre actividades, tours y experiencias seleccionadas para tu próximo viaje con Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });

    if (!isPlatformBrowser(this.platformId)) {
      this.sharedService.setLoading(false);
      return;
    }

    this.route.params.subscribe(params => {
      const locationCode = (params['location'] as string | undefined)?.toUpperCase();
      if (!locationCode) {
        this.includeTransfer = false;
        this.fetchActivities(this.defaultLat, this.defaultLng);
        return;
      }

      this.sharedService.setLoading(true);
      this.amadeusAuth.getToken().subscribe({
        next: (token) => {
          if (!token) {
            this.sharedService.setLoading(false);
            return;
          }
          this.airports.getLocation(locationCode, token).subscribe({
            next: (locationResponse) => {
              this.location = locationResponse.data;
              console.log(this.location);
              this.includeTransfer = this.transferIataCodes.has(this.location.iataCode);
              this.fetchActivities(this.location.geoCode.latitude, this.location.geoCode.longitude);
            },
            error: () => {
              this.includeTransfer = false;
              this.fetchActivities(this.defaultLat, this.defaultLng);
            }
          });
        },
        error: () => {
          this.includeTransfer = false;
          this.fetchActivities(this.defaultLat, this.defaultLng);
        }
      });
    });

    this.route.queryParams.subscribe(params => {
      this.applyQueryParams(params);
    });
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.updatePagedResults();
  }

  previousPage(): void {
    this.setPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.setPage(this.currentPage + 1);
  }

  private updatePagedResults(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedResults = this.allResults.slice(start, start + this.pageSize);
  }

  private fetchActivities(lat: number, lng: number): void {
    this.toursStore.getAllTours().pipe(take(1)).subscribe({
      next: (tours) => {
        const validTours = tours
          .filter(tour => this.isTourWithinRadius(tour, lat, lng, this.searchRadiusKm))
          .filter(tour => (tour.id || tour.amadeusId) && tour.pictures && tour.pictures.length > 0);

        this.allResults = validTours.map(tour => ({
          ...tour,
          id: tour.id ?? tour.amadeusId ?? '',
          pictures: tour.pictures.slice(0, 5)
        }));
        this.currentPage = 1;
        this.updatePagedResults();

        const locationName = this.location?.address?.cityName || this.location?.name;
        const title = locationName
          ? `Xplora Travel || Actividades en ${locationName}`
          : 'Xplora Travel || Actividades y Tours';
        const description = locationName
          ? `Explora actividades, tours y experiencias disponibles en ${locationName}. Reserva fácil y seguro con Xplora Travel.`
          : 'Explora actividades, tours y experiencias disponibles en tu destino. Reserva fácil y seguro con Xplora Travel.';
        const image = this.allResults[0]?.featuredImage || this.allResults[0]?.pictures?.[0];
        this.meta.setMeta({ title, description, image });
        this.sharedService.setLoading(false);
      },
      error: () => {
        this.allResults = [];
        this.pagedResults = [];
        this.meta.setMeta({
          title: 'Xplora Travel || Actividades y Tours',
          description: 'Explora actividades, tours y experiencias disponibles en tu destino. Reserva fácil y seguro con Xplora Travel.',
          image: '/assets/img/banner-generico.jpg'
        });
        this.sharedService.setLoading(false);
      }
    });
  }

  private applyQueryParams(params: Params): void {
    const nextParams: Record<string, string | number> = {};
    const adults = this.parsePositiveInt(params['adults']);
    const children = this.parsePositiveInt(params['children'] ?? params['childrens']);
    const infants = this.parsePositiveInt(params['infants']);
    const dateParam = typeof params['date'] === 'string' ? params['date'] : undefined;
    if (adults !== null) nextParams['adults'] = adults;
    if (children !== null) nextParams['children'] = children;
    if (infants !== null) nextParams['infants'] = infants;
    if (dateParam) nextParams['date'] = dateParam;
    this.searchParams = nextParams;
  }

  private isTourWithinRadius(tour: XploraTour, centerLat: number, centerLng: number, radiusKm: number): boolean {
    const lat = this.parseCoordinate(tour.geoCode?.latitude);
    const lng = this.parseCoordinate(tour.geoCode?.longitude);
    if (lat === null || lng === null) return false;
    return this.haversineDistanceKm(centerLat, centerLng, lat, lng) <= radiusKm;
  }

  private parseCoordinate(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c;
  }

  private parsePositiveInt(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.floor(parsed));
  }
}

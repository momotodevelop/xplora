import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AmadeusToursService } from '../../../../services/amadeus-tours.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { XploraToursService } from '../../../../services/xplora-tours.service';
import { AmadeusActivity } from '../../../../types/amadeus-tours-response.types';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

interface TourSearchItem {
  activity: AmadeusActivity;
  description: string;
  isSaved: boolean;
}

@Component({
  selector: 'app-admin-tours',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './admin-tours.component.html',
  styleUrl: './admin-tours.component.scss'
})
export class AdminToursComponent implements OnInit, OnDestroy {
  headerHeight = 0;
  results: TourSearchItem[] = [];
  displayedResults: TourSearchItem[] = [];
  searched = false;
  errorMessage = '';
  private savedTourIds = new Set<string>();
  private toursSubscription?: Subscription;
  readonly searchQuery = this.fb.control('');
  readonly sortOption = this.fb.control<'name' | 'price-asc' | 'price-desc'>('name');

  readonly searchForm = this.fb.group({
    latitude: [21.146023, [Validators.required]],
    longitude: [-86.835454, [Validators.required]],
    radius: [20, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private fb: FormBuilder,
    private amadeusTours: AmadeusToursService,
    private shared: SharedDataService,
    private tourStore: XploraToursService,
    private router: Router,
    private snackBar: MatSnackBar,
    private meta: MetaHandlerService
  ) {
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
  }

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Tours',
      description: 'Busca y administra tours disponibles para Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.toursSubscription = this.tourStore.getAllTours().subscribe(tours => {
      const ids = new Set<string>();
      tours.forEach(tour => {
        if (tour.id) ids.add(tour.id);
        if (tour.amadeusId) ids.add(tour.amadeusId);
      });
      this.savedTourIds = ids;
      this.refreshSavedFlags();
    });

    this.searchQuery.valueChanges.subscribe(() => this.applyFilters());
    this.sortOption.valueChanges.subscribe(() => this.applyFilters());
  }

  ngOnDestroy(): void {
    this.toursSubscription?.unsubscribe();
  }

  get totalResults(): number {
    return this.displayedResults.length;
  }

  searchTours(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      this.snackBar.open('Completa la latitud, longitud y radio.', 'OK', { duration: 1800 });
      return;
    }

    const { latitude, longitude, radius } = this.searchForm.value;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusValue = Number(radius);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusValue)) {
      this.snackBar.open('Coordenadas invalidas.', 'OK', { duration: 1800 });
      return;
    }

    this.shared.setLoading(true);
    this.errorMessage = '';

    this.amadeusTours.getActivities(lat, lng, radiusValue).subscribe({
      next: (response) => {
        const activities = response.data ?? [];
        this.results = activities.map(activity => ({
          activity: {
            ...activity,
            pictures: Array.isArray(activity.pictures) ? activity.pictures : []
          },
          description: this.normalizeDescription(activity),
          isSaved: this.savedTourIds.has(activity.id)
        }));
        this.applyFilters();
        this.searched = true;
        this.shared.setLoading(false);
      },
      error: () => {
        this.searched = true;
        this.results = [];
        this.displayedResults = [];
        this.errorMessage = 'No se pudo obtener la lista de tours.';
        this.shared.setLoading(false);
      }
    });
  }

  createManualTour(): void {
    const url = this.router.serializeUrl(this.router.createUrlTree(['/admin/tours/nuevo']));
    window.open(url, '_blank', 'noopener');
  }

  openTour(item: TourSearchItem): void {
    const activityId = item.activity?.id;
    if (!activityId) {
      this.snackBar.open('El tour no tiene ID.', 'OK', { duration: 1800 });
      return;
    }

    const url = item.isSaved
      ? this.router.serializeUrl(this.router.createUrlTree(['/admin/tours/editar', activityId]))
      : this.router.serializeUrl(this.router.createUrlTree(['/admin/tours/nuevo'], { queryParams: { activityId } }));
    window.open(url, '_blank', 'noopener');
  }

  private refreshSavedFlags(): void {
    if (!this.results.length) return;
    this.results = this.results.map(item => ({
      ...item,
      isSaved: this.savedTourIds.has(item.activity.id)
    }));
    this.applyFilters();
  }

  private normalizeDescription(activity: AmadeusActivity): string {
    const raw = activity.shortDescription ?? activity.description ?? '';
    return raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private applyFilters(): void {
    const query = String(this.searchQuery.value ?? '').trim().toLowerCase();
    let items = [...this.results];
    if (query) {
      items = items.filter(item => {
        const name = item.activity.name?.toLowerCase() ?? '';
        const description = item.description?.toLowerCase() ?? '';
        const id = item.activity.id?.toLowerCase() ?? '';
        return name.includes(query) || description.includes(query) || id.includes(query);
      });
    }
    const sortOption = this.sortOption.value ?? 'name';
    if (sortOption === 'name') {
      items.sort((a, b) => a.activity.name.localeCompare(b.activity.name));
    } else {
      items.sort((a, b) => {
        const priceA = this.getPriceValue(a.activity);
        const priceB = this.getPriceValue(b.activity);
        return sortOption === 'price-asc' ? priceA - priceB : priceB - priceA;
      });
    }
    this.displayedResults = items;
  }

  private getPriceValue(activity: AmadeusActivity): number {
    const amount = Number(activity.price?.amount ?? 0);
    return Number.isFinite(amount) ? amount : 0;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AngularEditorConfig, AngularEditorModule } from '@wfpena/angular-wysiwyg';
import { AmadeusToursService } from '../../../../services/amadeus-tours.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { XploraToursService } from '../../../../services/xplora-tours.service';
import { DEFAULT_TOUR_CONFIG, TourConfig, XploraTourConfigService } from '../../../../services/xplora-tour-config.service';
import { AmadeusActivity } from '../../../../types/amadeus-tours-response.types';
import { TourAvailabilityDay, TourDayKey, TourDiscountType, XploraTour } from '../../../../types/xplora-tour.types';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

interface LanguageOption {
  key: string;
  label: string;
}

const DAY_OPTIONS: { key: TourDayKey; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miercoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sabado' },
  { key: 'sunday', label: 'Domingo' }
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { key: 'Espanol', label: 'Espanol' },
  { key: 'Ingles', label: 'Ingles' },
  { key: 'Frances', label: 'Frances' },
  { key: 'Aleman', label: 'Aleman' },
  { key: 'Italiano', label: 'Italiano' },
  { key: 'Portugues', label: 'Portugues' },
  { key: 'Japones', label: 'Japones' },
  { key: 'Chino', label: 'Chino' }
];

@Component({
  selector: 'app-admin-tour-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatTimepickerModule,
    AngularEditorModule,
    MatDialogModule,
    MatNativeDateModule
  ],
  templateUrl: './admin-tour-form.component.html',
  styleUrl: './admin-tour-form.component.scss'
})
export class AdminTourFormComponent implements OnInit {
  headerHeight = 0;
  isEditing = false;
  loading = false;
  errorMessage = '';
  source: 'amadeus' | 'manual' = 'manual';
  tourId?: string;
  apiActivityId = new FormControl('');
  showPricingDetails = false;
  readonly ratingOptions = [1, 2, 3, 4, 5];

  readonly dayOptions = DAY_OPTIONS;
  readonly languageOptions = LANGUAGE_OPTIONS;
  readonly discountTypeOptions: { id: TourDiscountType; label: string }[] = [
    { id: 'percentage', label: 'Porcentaje' },
    { id: 'fixed', label: 'Monto fijo' }
  ];
  operatorOptions: string[] = [...DEFAULT_TOUR_CONFIG.operatorSuggestions];
  categoryOptions: string[] = [...DEFAULT_TOUR_CONFIG.categorySuggestions];
  includesOptions: string[] = [...DEFAULT_TOUR_CONFIG.includeSuggestions];
  excludesOptions: string[] = [...DEFAULT_TOUR_CONFIG.excludeSuggestions];
  tourConfig: TourConfig = DEFAULT_TOUR_CONFIG;
  private brokenImageUrls = new Set<string>();

  readonly form = this.fb.group({
    amadeusId: [''],
    type: ['ACTIVITY', Validators.required],
    name: ['', Validators.required],
    shortDescription: [''],
    description: [''],
    bookingLink: [''],
    minimumDuration: [''],
    rating: [''],
    priceUsd: ['', [Validators.required, Validators.min(0)]],
    exchangeRate: [18, [Validators.required, Validators.min(0)]],
    discountType: ['percentage', Validators.required],
    discountValue: [0, [Validators.required, Validators.min(0)]],
    operatorName: ['', Validators.required],
    categories: this.fb.control<string[]>([], { nonNullable: true }),
    featuredImage: [''],
    geoCode: this.fb.group({
      latitude: ['', Validators.required],
      longitude: ['', Validators.required]
    }),
    price: this.fb.group({
      currencyCode: ['MXN', Validators.required],
      amount: ['', Validators.required]
    }),
    originalPrice: this.fb.group({
      currencyCode: ['MXN'],
      amount: ['']
    }),
    self: this.fb.group({
      href: [''],
      methods: this.fb.array([] as FormControl<string | null>[])
    }),
    pictures: this.fb.array([] as FormControl<string | null>[]),
    availableDays: this.fb.array([] as FormGroup[]),
    availableTimes: this.fb.array([] as FormControl<Date | null>[]),
    languages: this.fb.group({}),
    includes: this.fb.array([] as FormControl<string | null>[]),
    excludes: this.fb.array([] as FormControl<string | null>[])
  });

  readonly editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    minHeight: '200px',
    placeholder: 'Escribe la descripcion completa del tour...',
    translate: 'no'
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private amadeusTours: AmadeusToursService,
    private tourStore: XploraToursService,
    private tourConfigService: XploraTourConfigService,
    private shared: SharedDataService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private meta: MetaHandlerService
  ) {
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
  }

  get discountTypeValue(): TourDiscountType {
    return (this.form.get('discountType')?.value as TourDiscountType) ?? 'percentage';
  }

  get ratingValue(): number | null {
    return this.parseNumber(this.form.get('rating')?.value);
  }

  setRating(value: number): void {
    const sanitized = Math.min(Math.max(value, 1), 5);
    this.form.get('rating')?.setValue(sanitized.toFixed(1));
  }

  clearRating(): void {
    this.form.get('rating')?.setValue('');
  }

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Tours',
      description: 'Crea o edita tours y actividades disponibles para Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.initializeLanguages();
    this.initializeDays();
    this.addPicture();
    this.addMethod('GET');
    this.addInclude();
    this.addExclude();
    this.addAvailableTime();
    const tourId = this.route.snapshot.paramMap.get('tourId');
    const activityId = this.route.snapshot.queryParamMap.get('activityId');

    if (tourId) {
      this.isEditing = true;
      this.tourId = tourId;
    }

    this.form.get('priceUsd')?.valueChanges.subscribe(() => this.updatePricing());
    this.form.get('exchangeRate')?.valueChanges.subscribe(() => this.updatePricing());
    this.form.get('discountType')?.valueChanges.subscribe(() => this.updatePricing());
    this.form.get('discountValue')?.valueChanges.subscribe(() => this.updatePricing());

    this.tourConfigService.watchTourConfig().subscribe((config) => {
      this.tourConfig = config;
      this.operatorOptions = config.operatorSuggestions ?? [];
      this.categoryOptions = this.mergeUniqueLists(config.categorySuggestions ?? [], this.getSelectedCategories());
      this.includesOptions = config.includeSuggestions ?? [];
      this.excludesOptions = config.excludeSuggestions ?? [];
      const exchangeControl = this.form.get('exchangeRate');
      if (!this.isEditing && exchangeControl && !exchangeControl.dirty) {
        exchangeControl.setValue(config.defaultExchangeRate, { emitEvent: false });
      }
      this.updatePricing();
    });

    if (tourId) {
      this.openLoadDialog(tourId);
      return;
    }

    if (activityId) {
      this.loadFromAmadeus(activityId);
    }
  }

  get pictures(): FormArray<FormControl<string | null>> {
    return this.form.get('pictures') as FormArray<FormControl<string | null>>;
  }

  get methods(): FormArray<FormControl<string | null>> {
    return this.form.get('self.methods') as FormArray<FormControl<string | null>>;
  }

  get includes(): FormArray<FormControl<string | null>> {
    return this.form.get('includes') as FormArray<FormControl<string | null>>;
  }

  get excludes(): FormArray<FormControl<string | null>> {
    return this.form.get('excludes') as FormArray<FormControl<string | null>>;
  }

  get availableDays(): FormArray<FormGroup> {
    return this.form.get('availableDays') as FormArray<FormGroup>;
  }

  get availableTimes(): FormArray<FormControl<Date | null>> {
    return this.form.get('availableTimes') as FormArray<FormControl<Date | null>>;
  }

  get languagesForm(): FormGroup {
    return this.form.get('languages') as FormGroup;
  }

  addPicture(value = ''): void {
    this.pictures.push(this.fb.control<string | null>(value));
  }

  removePicture(index: number): void {
    const removed = this.pictures.at(index)?.value ?? '';
    this.pictures.removeAt(index);
    this.clearImageError(removed);
    if (this.isFeaturedImage(removed)) {
      const fallback = this.pictures.at(0)?.value ?? '';
      this.setFeaturedImage(fallback);
    }
  }

  addMethod(value = ''): void {
    this.methods.push(this.fb.control<string | null>(value));
  }

  removeMethod(index: number): void {
    this.methods.removeAt(index);
  }

  addInclude(value = ''): void {
    this.includes.push(this.fb.control<string | null>(value));
  }

  removeInclude(index: number): void {
    this.includes.removeAt(index);
  }

  addExclude(value = ''): void {
    this.excludes.push(this.fb.control<string | null>(value));
  }

  removeExclude(index: number): void {
    this.excludes.removeAt(index);
  }

  addAvailableTime(value?: string | Date): void {
    this.availableTimes.push(this.createTimeControl(value ?? null));
  }

  removeAvailableTime(index: number): void {
    this.availableTimes.removeAt(index);
  }

  setFeaturedImage(url: string | null): void {
    const value = String(url ?? '').trim();
    this.form.get('featuredImage')?.setValue(value);
  }

  isFeaturedImage(url: string | null): boolean {
    const current = String(this.form.get('featuredImage')?.value ?? '').trim();
    const candidate = String(url ?? '').trim();
    return Boolean(candidate) && candidate === current;
  }

  onImageUrlInput(value: string | null): void {
    this.clearImageError(value);
  }

  markImageBroken(url: string | null): void {
    const value = String(url ?? '').trim();
    if (!value) return;
    this.brokenImageUrls.add(value);
  }

  clearImageError(url: string | null): void {
    const value = String(url ?? '').trim();
    if (!value) return;
    this.brokenImageUrls.delete(value);
  }

  isImageBroken(url: string | null): boolean {
    const value = String(url ?? '').trim();
    if (!value) return true;
    return this.brokenImageUrls.has(value);
  }

  filteredOperators(query: string | null): string[] {
    return this.filterOptions(query, this.operatorOptions);
  }

  filteredIncludes(query: string | null): string[] {
    return this.filterOptions(query, this.includesOptions);
  }

  filteredExcludes(query: string | null): string[] {
    return this.filterOptions(query, this.excludesOptions);
  }

  async loadFromAmadeus(activityId: string): Promise<void> {
    if (!activityId) return;
    this.shared.setLoading(true);
    this.errorMessage = '';
    this.source = 'amadeus';
    this.apiActivityId.setValue(activityId);
    this.form.patchValue({ amadeusId: activityId });

    this.amadeusTours.getActivityDetails(activityId).subscribe({
      next: response => {
        const activity = response.data;
        this.applyActivityToForm(activity);
        this.shared.setLoading(false);
      },
      error: () => {
        this.errorMessage = 'No se pudo cargar el tour desde Amadeus.';
        this.shared.setLoading(false);
      }
    });
  }

  async loadFromFirestore(tourId: string): Promise<void> {
    this.shared.setLoading(true);
    this.errorMessage = '';
    try {
      const tour = await this.tourStore.fetchTour(tourId);
      if (!tour) {
        this.errorMessage = 'No se encontro el tour en Firestore.';
        return;
      }
      this.source = tour.source ?? (tour.amadeusId ? 'amadeus' : 'manual');
      this.applyTourToForm(tour);
    } catch (error) {
      this.errorMessage = 'No se pudo cargar el tour.';
    } finally {
      this.shared.setLoading(false);
    }
  }

  private openLoadDialog(tourId: string): void {
    const dialogRef = this.dialog.open(TourLoadChoiceDialogComponent, {
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(async (choice: 'firestore' | 'source' | undefined) => {
      if (choice === 'source') {
        await this.loadFromSource(tourId);
        return;
      }
      this.loadFromFirestore(tourId);
    });
  }

  private async loadFromSource(tourId: string): Promise<void> {
    try {
      const tour = await this.tourStore.fetchTour(tourId);
      const amadeusId = tour?.amadeusId ?? (tour?.source === 'amadeus' ? tourId : undefined);
      if (!amadeusId) {
        this.snackBar.open('No hay fuente disponible. Se carga desde Firestore.', 'OK', { duration: 2000 });
        if (tour) {
          this.applyTourToForm(tour);
          return;
        }
        this.loadFromFirestore(tourId);
        return;
      }
      this.loadFromAmadeus(amadeusId);
    } catch (error) {
      this.snackBar.open('No se pudo cargar desde la fuente.', 'OK', { duration: 2000 });
      this.loadFromFirestore(tourId);
    }
  }

  async saveTour(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos.', 'OK', { duration: 2000 });
      return;
    }

    this.updatePricing();

    const value = this.form.value;
    const selectedLanguages = this.languageOptions
      .filter(option => Boolean((value.languages as any)?.[option.key]))
      .map(option => option.key);
    const globalTimes = this.availableTimes.controls
      .map(timeControl => this.formatTime(timeControl.value))
      .filter((time): time is string => Boolean(time));
    const availableDays = this.availableDays.controls.map(control => {
      const group = control;
      const enabled = Boolean(group.get('enabled')?.value);
      return {
        key: group.get('key')?.value as TourDayKey,
        label: group.get('label')?.value as string,
        enabled,
        times: enabled ? globalTimes : []
      } as TourAvailabilityDay;
    });

    const pictures = this.pictures.controls
      .map(control => String(control.value ?? '').trim())
      .filter(Boolean);
    const includes = this.includes.controls
      .map(control => String(control.value ?? '').trim())
      .filter(Boolean);
    const excludes = this.excludes.controls
      .map(control => String(control.value ?? '').trim())
      .filter(Boolean);
    const methods = this.methods.controls
      .map(control => String(control.value ?? '').trim())
      .filter(Boolean);

    const originalAmount = String(value.originalPrice?.amount ?? '').trim();
    const originalPrice = originalAmount
      ? { currencyCode: 'MXN', amount: originalAmount }
      : undefined;

    const priceUsdValue = String(value.priceUsd ?? '').trim();
    const exchangeRateValue = Number(value.exchangeRate);
    const discountTypeValue = value.discountType as TourDiscountType | undefined;
    const discountValueNumber = Number(value.discountValue);
    const featuredImage = String(value.featuredImage ?? '').trim() || pictures[0] || undefined;
    const ratingValue = this.parseNumber(value.rating);
    const normalizedRating = ratingValue && ratingValue > 0
      ? Math.min(Math.max(ratingValue, 1), 5)
      : 4.0;

    const tour: XploraTour = {
      id: this.tourId,
      amadeusId: String(value.amadeusId ?? '').trim() || undefined,
      type: String(value.type ?? '').trim(),
      name: String(value.name ?? '').trim(),
      shortDescription: String(value.shortDescription ?? '').trim(),
      description: String(value.description ?? '').trim(),
      geoCode: {
        latitude: String(value.geoCode?.latitude ?? '').trim(),
        longitude: String(value.geoCode?.longitude ?? '').trim()
      },
      rating: normalizedRating.toFixed(1),
      pictures,
      featuredImage,
      bookingLink: String(value.bookingLink ?? '').trim(),
      price: {
        currencyCode: 'MXN',
        amount: String(value.price?.amount ?? '').trim()
      },
      originalPrice,
      priceUsd: priceUsdValue
        ? {
            currencyCode: 'USD',
            amount: priceUsdValue
          }
        : undefined,
      exchangeRate: Number.isFinite(exchangeRateValue) ? exchangeRateValue : undefined,
      discountType: discountTypeValue,
      discountValue: Number.isFinite(discountValueNumber) ? discountValueNumber : undefined,
      minimumDuration: String(value.minimumDuration ?? '').trim(),
      self: {
        href: String(value.self?.href ?? '').trim(),
        methods: methods.length ? methods : ['GET']
      },
      operatorName: String(value.operatorName ?? '').trim(),
      categories: this.normalizeList(value.categories ?? []),
      availableDays,
      languages: selectedLanguages,
      includes,
      excludes,
      source: this.source
    };

    this.shared.setLoading(true);
    try {
      const tourId = this.tourId ?? tour.amadeusId ?? undefined;
      await this.tourStore.saveTour(tour, { tourId, isNew: !this.isEditing });
      this.snackBar.open('Tour guardado correctamente.', 'OK', { duration: 1800 });
      this.router.navigate(['/admin/tours']);
    } catch (error) {
      this.snackBar.open('No se pudo guardar el tour.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  private initializeLanguages(): void {
    const group: Record<string, FormControl<boolean>> = {};
    this.languageOptions.forEach(option => {
      group[option.key] = this.fb.control(false, { nonNullable: true });
    });
    this.form.setControl('languages', this.fb.group(group));
  }

  private initializeDays(): void {
    this.availableDays.clear();
    this.dayOptions.forEach(day => {
      this.availableDays.push(this.fb.group({
        key: [day.key],
        label: [day.label],
        enabled: [false]
      }));
    });
  }

  private applyActivityToForm(activity: AmadeusActivity): void {
    if (!activity) return;

    const description = activity.description ?? '';
    const shortDescription = activity.shortDescription ?? '';

    this.brokenImageUrls.clear();
    this.form.patchValue({
      amadeusId: activity.id,
      type: activity.type,
      name: activity.name,
      shortDescription,
      description,
      bookingLink: activity.bookingLink,
      minimumDuration: activity.minimumDuration,
      rating: activity.rating ?? '',
      priceUsd: activity.price?.amount ?? '',
      exchangeRate: this.form.get('exchangeRate')?.value ?? 18,
      discountType: 'percentage',
      discountValue: 0,
      featuredImage: activity.pictures?.[0] ?? '',
      categories: [],
      geoCode: {
        latitude: String(activity.geoCode?.latitude ?? ''),
        longitude: String(activity.geoCode?.longitude ?? '')
      },
      price: {
        currencyCode: 'MXN',
        amount: ''
      },
      originalPrice: {
        currencyCode: 'MXN',
        amount: ''
      },
      self: {
        href: activity.self?.href ?? ''
      }
    });

    this.setFormArray(this.pictures, activity.pictures ?? []);
    this.setFormArray(this.methods, activity.self?.methods ?? ['GET']);
    this.setTimesArray(this.availableTimes, []);
    this.updatePricing();
  }

  private applyTourToForm(tour: XploraTour): void {
    const description = tour.description ?? '';
    const shortDescription = tour.shortDescription ?? '';
    const listAmount = this.parseNumber(tour.originalPrice?.amount);
    const finalAmount = this.parseNumber(tour.price?.amount);
    let discountType: TourDiscountType = tour.discountType ?? 'percentage';
    let discountValue = tour.discountValue ?? 0;
    if (tour.discountType === undefined && tour.discountValue === undefined && listAmount !== null && finalAmount !== null) {
      discountType = 'fixed';
      discountValue = Math.max(listAmount - finalAmount, 0);
    }

    this.brokenImageUrls.clear();
    this.form.patchValue({
      amadeusId: tour.amadeusId ?? '',
      type: tour.type ?? 'ACTIVITY',
      name: tour.name,
      shortDescription,
      description,
      bookingLink: tour.bookingLink,
      minimumDuration: tour.minimumDuration,
      rating: tour.rating ?? '',
      operatorName: tour.operatorName ?? '',
      priceUsd: tour.priceUsd?.amount ?? '',
      exchangeRate: tour.exchangeRate ?? this.form.get('exchangeRate')?.value ?? 18,
      discountType,
      discountValue,
      featuredImage: tour.featuredImage ?? tour.pictures?.[0] ?? '',
      categories: [...(tour.categories ?? [])],
      geoCode: {
        latitude: String(tour.geoCode?.latitude ?? ''),
        longitude: String(tour.geoCode?.longitude ?? '')
      },
      price: {
        currencyCode: 'MXN',
        amount: tour.price?.amount ?? ''
      },
      originalPrice: {
        currencyCode: 'MXN',
        amount: tour.originalPrice?.amount ?? ''
      },
      self: {
        href: tour.self?.href ?? ''
      }
    });

    this.setFormArray(this.pictures, tour.pictures ?? []);
    this.setFormArray(this.methods, tour.self?.methods ?? ['GET']);
    this.setFormArray(this.includes, tour.includes ?? []);
    this.setFormArray(this.excludes, tour.excludes ?? []);
    this.categoryOptions = this.mergeUniqueLists(this.categoryOptions, tour.categories ?? []);
    const firstTimes = (tour.availableDays ?? []).find(day => day.times && day.times.length > 0)?.times ?? [];
    this.setTimesArray(this.availableTimes, firstTimes);
    this.updatePricing();

    const languagesGroup = this.languagesForm;
    this.languageOptions.forEach(option => {
      const selected = tour.languages?.includes(option.key) ?? false;
      const control = languagesGroup.get(option.key) as FormControl<boolean> | null;
      if (control) {
        control.setValue(selected);
      }
    });

    const savedDays = tour.availableDays ?? [];
    this.availableDays.clear();
    this.dayOptions.forEach(day => {
      const saved = savedDays.find(item => item.key === day.key);
      this.availableDays.push(this.fb.group({
        key: [day.key],
        label: [day.label],
        enabled: [saved?.enabled ?? false]
      }));
    });
  }

  private setFormArray(formArray: FormArray<FormControl<string | null>>, values: string[]): void {
    formArray.clear();
    values.forEach(value => formArray.push(this.fb.control<string | null>(value)));
  }

  private setTimesArray(formArray: FormArray<FormControl<Date | null>>, values: string[]): void {
    formArray.clear();
    values.forEach(value => formArray.push(this.createTimeControl(value)));
    if (!formArray.length) {
      formArray.push(this.createTimeControl(null));
    }
  }

  private createTimeControl(value: string | Date | null): FormControl<Date | null> {
    if (!value) return this.fb.control(null);
    if (value instanceof Date) return this.fb.control(value);
    const parsed = this.parseTime(value);
    return this.fb.control(parsed);
  }

  private parseTime(value: string): Date | null {
    if (!value) return null;
    const parts = value.split(':');
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return null;
    }
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private formatTime(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    return null;
  }

  private getSelectedCategories(): string[] {
    const value = this.form.get('categories')?.value;
    return Array.isArray(value) ? value : [];
  }

  private mergeUniqueLists(base: string[], extra: string[]): string[] {
    const set = new Set<string>();
    [base, extra].forEach(list => {
      list.forEach(item => {
        const normalized = String(item ?? '').trim();
        if (normalized) {
          set.add(normalized);
        }
      });
    });
    return Array.from(set);
  }

  private normalizeList(values: unknown): string[] {
    if (!Array.isArray(values)) return [];
    const seen = new Set<string>();
    values.forEach(value => {
      const normalized = String(value ?? '').trim();
      if (normalized) {
        seen.add(normalized);
      }
    });
    return Array.from(seen);
  }

  private parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private filterOptions(query: string | null, options: string[]): string[] {
    const value = String(query ?? '').trim().toLowerCase();
    if (!value) return options;
    return options.filter(option => option.toLowerCase().includes(value));
  }

  private updatePricing(): void {
    const usdValue = Number(this.form.get('priceUsd')?.value ?? 0);
    const exchangeRate = Number(this.form.get('exchangeRate')?.value ?? 0);
    let listPrice: number | null = null;
    const hasValidUsd = Number.isFinite(usdValue) && Number.isFinite(exchangeRate) && usdValue > 0 && exchangeRate > 0;
    if (hasValidUsd) {
      listPrice = usdValue * exchangeRate;
      if (this.tourConfig?.applyPriceMultiplier) {
        const multiplierPercent = Number(this.tourConfig.priceMultiplierPercent ?? 0);
        if (Number.isFinite(multiplierPercent) && multiplierPercent > 0) {
          listPrice *= 1 + (multiplierPercent / 100);
        }
      }
      this.form.get('originalPrice.amount')?.setValue(listPrice.toFixed(2), { emitEvent: false });
    } else {
      listPrice = this.parseNumber(this.form.get('originalPrice.amount')?.value);
    }
    if (listPrice === null || listPrice <= 0) {
      return;
    }
    const discountType = this.discountTypeValue;
    const discountValue = Number(this.form.get('discountValue')?.value ?? 0);
    const validDiscountValue = Number.isFinite(discountValue) ? Math.max(discountValue, 0) : 0;
    const discountAmount = discountType === 'percentage'
      ? listPrice * (validDiscountValue / 100)
      : validDiscountValue;
    const finalPrice = Math.max(listPrice - Math.min(discountAmount, listPrice), 0);

    this.form.get('price.amount')?.setValue(finalPrice.toFixed(2), { emitEvent: false });
  }
}

@Component({
  selector: 'app-tour-load-choice-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>¿Como deseas cargar este tour?</h2>
    <div mat-dialog-content>
      <p>Puedes cargar la informacion guardada en Firestore o volver a traerla desde la fuente (Amadeus).</p>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="choose('firestore')">Cargar Firestore</button>
      <button mat-flat-button color="primary" type="button" (click)="choose('source')">Cargar desde fuente</button>
    </div>
  `
})
export class TourLoadChoiceDialogComponent {
  constructor(private dialogRef: MatDialogRef<TourLoadChoiceDialogComponent>) {}

  choose(mode: 'firestore' | 'source') {
    this.dialogRef.close(mode);
  }
}

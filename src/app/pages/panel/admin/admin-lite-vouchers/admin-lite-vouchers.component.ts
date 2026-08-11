import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MetaHandlerService } from '../../../../services/meta-handler.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { DEFAULT_TOUR_CONFIG, TourConfig, XploraTourConfigService } from '../../../../services/xplora-tour-config.service';
import { XploraPaymentOfficeTypesService } from '../../../../services/xplora-payment-office-types.service';
import { XploraPaymentOfficesService } from '../../../../services/xplora-payment-offices.service';
import { XploraPaymentConfigService } from '../../../../services/xplora-payment-config.service';
import { XploraSpeiAccountsService } from '../../../../services/xplora-spei-accounts.service';
import { DuffelStaysService } from '../../../../services/duffel-stays.service';
import {
  DuffelEnvironment,
  FlightAdminConfig,
  XploraFlightConfigService
} from '../../../../services/xplora-flight-config.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  DEFAULT_PAYMENT_CONFIG,
  PaymentOffice,
  PaymentOfficeType,
  SpeiAccount
} from '../../../../types/payment-config.types';
import { AdminPaymentOfficeFormDialogComponent } from './admin-payment-office-form-dialog.component';
import { AdminPaymentOfficeTypeFormDialogComponent } from './admin-payment-office-type-form-dialog.component';
import { AdminSpeiAccountFormDialogComponent } from './admin-spei-account-form-dialog.component';
import { computeSpeiCoverageWarnings } from './admin-payment-config-form.utils';

@Component({
  selector: 'app-admin-lite-vouchers',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-lite-vouchers.component.html',
  styleUrl: './admin-lite-vouchers.component.scss'
})
export class AdminLiteVouchersComponent implements OnInit {
  private tourLoaded = false;
  private paymentConfigLoaded = false;
  private readonly currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  readonly separatorKeys = [ENTER, COMMA];

  readonly configForm = this.fb.group({
    defaultExchangeRate: [DEFAULT_TOUR_CONFIG.defaultExchangeRate, [Validators.required, Validators.min(0)]],
    applyPriceMultiplier: [DEFAULT_TOUR_CONFIG.applyPriceMultiplier],
    priceMultiplierPercent: [DEFAULT_TOUR_CONFIG.priceMultiplierPercent, [Validators.min(0)]],
    operatorSuggestions: this.fb.control<string[]>([...DEFAULT_TOUR_CONFIG.operatorSuggestions], { nonNullable: true }),
    categorySuggestions: this.fb.control<string[]>([...DEFAULT_TOUR_CONFIG.categorySuggestions], { nonNullable: true }),
    includeSuggestions: this.fb.control<string[]>([...DEFAULT_TOUR_CONFIG.includeSuggestions], { nonNullable: true }),
    excludeSuggestions: this.fb.control<string[]>([...DEFAULT_TOUR_CONFIG.excludeSuggestions], { nonNullable: true })
  });

  readonly flightConfigForm = this.fb.group({
    environment: this.fb.control<DuffelEnvironment>('test', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    productionToken: this.fb.control('', { nonNullable: true }),
    testToken: this.fb.control('', { nonNullable: true }),
    usdExchangeRate: this.fb.control(18, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.0001)]
    }),
    flightsPercent: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(-100), Validators.max(1000)]
    }),
    ancillariesPercent: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(-100), Validators.max(1000)]
    }),
    seatsPercent: this.fb.control(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(-100), Validators.max(1000)]
    })
  });

  flightSecrets = {
    productionConfigured: false,
    testConfigured: false
  };
  flightConfigLoading = false;
  flightConnectionStatus: 'unverified' | 'checking' | 'connected' | 'failed' = 'unverified';

  readonly staysConfigForm = this.fb.group({
    enabled: this.fb.control(false, { nonNullable: true }),
    environment: this.fb.control<DuffelEnvironment>('test', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    productionToken: this.fb.control('', { nonNullable: true }),
    testToken: this.fb.control('', { nonNullable: true })
  });
  staysSecrets = {
    productionConfigured: false,
    testConfigured: false
  };
  staysConfigLoading = false;
  staysConnectionStatus: 'unverified' | 'checking' | 'connected' | 'failed' = 'unverified';

  readonly paymentConfigForm = this.fb.group({
    speiPaymentTimeMinutes: this.fb.control(DEFAULT_PAYMENT_CONFIG.speiPaymentTimeMinutes, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]
    })
  });

  speiAccounts: SpeiAccount[] = [];
  officeTypeOptions: PaymentOfficeType[] = [];
  paymentOffices: PaymentOffice[] = [];
  speiCoverageWarnings: string[] = [];

  constructor(
    private meta: MetaHandlerService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private configService: XploraTourConfigService,
    private flightConfigService: XploraFlightConfigService,
    private staysService: DuffelStaysService,
    private paymentConfigService: XploraPaymentConfigService,
    private speiAccountsService: XploraSpeiAccountsService,
    private officeTypesService: XploraPaymentOfficeTypesService,
    private officesService: XploraPaymentOfficesService,
    private snackBar: MatSnackBar,
    private shared: SharedDataService
  ) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Configuracion',
      description: 'Configura las opciones del panel administrativo de Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });

    this.configForm.get('applyPriceMultiplier')?.valueChanges.subscribe((enabled) => {
      const multiplier = this.configForm.get('priceMultiplierPercent');
      if (!multiplier) return;
      if (enabled) {
        multiplier.enable({ emitEvent: false });
      } else {
        multiplier.disable({ emitEvent: false });
      }
    });

    if (!this.configForm.get('applyPriceMultiplier')?.value) {
      this.configForm.get('priceMultiplierPercent')?.disable({ emitEvent: false });
    }

    const connectionControls = this.flightConfigForm.controls;
    [
      connectionControls.environment,
      connectionControls.productionToken,
      connectionControls.testToken
    ].forEach(control => {
      control.valueChanges.subscribe(() => {
        this.flightConnectionStatus = 'unverified';
      });
    });

    this.staysConfigForm.valueChanges.subscribe(() => {
      this.staysConnectionStatus = 'unverified';
    });

    this.configService.watchTourConfig().subscribe((config) => {
      if (this.tourLoaded && this.configForm.dirty) {
        return;
      }
      this.patchForm(config);
      this.tourLoaded = true;
    });

    this.speiAccountsService.watchAccounts().subscribe((accounts) => {
      this.speiAccounts = [...(accounts ?? [])].sort((a, b) => {
        const diff = Number(a.minAmount ?? 0) - Number(b.minAmount ?? 0);
        return diff !== 0 ? diff : (a.label ?? '').localeCompare(b.label ?? '');
      });
      this.speiCoverageWarnings = computeSpeiCoverageWarnings(this.speiAccounts);
    });

    this.paymentConfigService.watchPaymentConfig().subscribe(config => {
      if (this.paymentConfigLoaded && this.paymentConfigForm.dirty) {
        return;
      }
      this.paymentConfigForm.patchValue({
        speiPaymentTimeMinutes: config.speiPaymentTimeMinutes
      }, { emitEvent: false });
      this.paymentConfigForm.markAsPristine();
      this.paymentConfigLoaded = true;
    });

    this.officeTypesService.watchOfficeTypes().subscribe((types) => {
      this.officeTypeOptions = [...(types ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    });

    this.officesService.watchOffices().subscribe((offices) => {
      this.paymentOffices = [...(offices ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    });

    void this.loadFlightConfig();
    void this.loadStaysConfig();
  }

  async savePaymentConfig(): Promise<void> {
    if (this.paymentConfigForm.invalid) {
      this.paymentConfigForm.markAllAsTouched();
      this.snackBar.open('Ingresa un plazo válido en minutos.', 'OK', { duration: 2000 });
      return;
    }

    this.shared.setLoading(true);
    try {
      await this.paymentConfigService.savePaymentConfig({
        speiPaymentTimeMinutes: Number(this.paymentConfigForm.controls.speiPaymentTimeMinutes.value)
      });
      this.paymentConfigForm.markAsPristine();
      this.snackBar.open('Plazo de pago por SPEI actualizado.', 'OK', { duration: 1800 });
    } catch (error) {
      this.snackBar.open('No fue posible actualizar el plazo de pago por SPEI.', 'OK', { duration: 2400 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  async saveConfig(): Promise<void> {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos.', 'OK', { duration: 1800 });
      return;
    }

    this.shared.setLoading(true);
    try {
      const value = this.configForm.getRawValue();
      const config: TourConfig = {
        defaultExchangeRate: Number(value.defaultExchangeRate),
        applyPriceMultiplier: Boolean(value.applyPriceMultiplier),
        priceMultiplierPercent: Number(value.priceMultiplierPercent ?? 0),
        operatorSuggestions: this.normalizeList(value.operatorSuggestions ?? []),
        categorySuggestions: this.normalizeList(value.categorySuggestions ?? []),
        includeSuggestions: this.normalizeList(value.includeSuggestions ?? []),
        excludeSuggestions: this.normalizeList(value.excludeSuggestions ?? [])
      };
      await this.configService.saveTourConfig(config);
      this.snackBar.open('Configuracion guardada.', 'OK', { duration: 1600 });
      this.configForm.markAsPristine();
    } catch (error) {
      this.snackBar.open('No se pudo guardar la configuracion.', 'OK', { duration: 1800 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  async loadFlightConfig(): Promise<void> {
    this.flightConfigLoading = true;
    try {
      const config = await this.flightConfigService.getAdminConfig();
      this.patchFlightConfigForm(config);
    } catch (error) {
      this.snackBar.open(
        'No se pudo cargar la configuracion de vuelos.',
        'OK',
        { duration: 2400 }
      );
    } finally {
      this.flightConfigLoading = false;
    }
  }

  async saveDuffelConnectionConfig(): Promise<void> {
    const controls = this.flightConfigForm.controls;
    if (controls.environment.invalid) {
      controls.environment.markAsTouched();
      this.snackBar.open('Selecciona el entorno de Duffel.', 'OK', {
        duration: 2200
      });
      return;
    }

    const value = this.flightConfigForm.getRawValue();

    this.flightConfigLoading = true;
    this.shared.setLoading(true);
    try {
      const saved = await this.flightConfigService.saveAdminConfig({
        section: 'connection',
        config: {
          environment: value.environment
        },
        productionToken: value.productionToken.trim() || undefined,
        testToken: value.testToken.trim() || undefined
      });
      this.flightConfigForm.patchValue({
        environment: saved.environment,
        productionToken: '',
        testToken: ''
      }, { emitEvent: false });
      this.flightSecrets = { ...saved.secrets };
      controls.environment.markAsPristine();
      controls.productionToken.markAsPristine();
      controls.testToken.markAsPristine();
      this.flightConnectionStatus = 'unverified';
      this.snackBar.open('Tokens y entorno de Duffel guardados.', 'OK', {
        duration: 1800
      });
    } catch (error) {
      this.snackBar.open(this.getFlightConfigError(error), 'OK', {
        duration: 3000
      });
    } finally {
      this.flightConfigLoading = false;
      this.shared.setLoading(false);
    }
  }

  async saveFlightPricingConfig(): Promise<void> {
    const controls = this.flightConfigForm.controls;
    const pricingControls = [
      controls.usdExchangeRate,
      controls.flightsPercent,
      controls.ancillariesPercent,
      controls.seatsPercent
    ];
    if (pricingControls.some(control => control.invalid)) {
      pricingControls.forEach(control => control.markAsTouched());
      this.snackBar.open('Revisa los valores de tarifas y pagos.', 'OK', {
        duration: 2200
      });
      return;
    }

    const value = this.flightConfigForm.getRawValue();
    this.flightConfigLoading = true;
    this.shared.setLoading(true);
    try {
      const saved = await this.flightConfigService.saveAdminConfig({
        section: 'pricing',
        config: {
          usdExchangeRate: Number(value.usdExchangeRate),
          modifiers: {
            flightsPercent: Number(value.flightsPercent),
            ancillariesPercent: Number(value.ancillariesPercent),
            seatsPercent: Number(value.seatsPercent)
          }
        }
      });
      this.flightConfigForm.patchValue({
        usdExchangeRate: saved.usdExchangeRate,
        flightsPercent: saved.modifiers.flightsPercent,
        ancillariesPercent: saved.modifiers.ancillariesPercent,
        seatsPercent: saved.modifiers.seatsPercent
      }, { emitEvent: false });
      pricingControls.forEach(control => control.markAsPristine());
      this.snackBar.open('Tarifas y pagos de vuelos guardados.', 'OK', {
        duration: 1800
      });
    } catch (error) {
      this.snackBar.open(this.getFlightConfigError(error), 'OK', {
        duration: 3000
      });
    } finally {
      this.flightConfigLoading = false;
      this.shared.setLoading(false);
    }
  }

  async verifyDuffelConnection(): Promise<void> {
    const controls = this.flightConfigForm.controls;
    if (
      controls.environment.dirty ||
      controls.productionToken.dirty ||
      controls.testToken.dirty
    ) {
      this.snackBar.open(
        'Guarda los tokens y el entorno antes de verificar la conexion.',
        'OK',
        { duration: 2600 }
      );
      return;
    }

    this.flightConnectionStatus = 'checking';
    try {
      const status = await this.flightConfigService.verifyConnection();
      this.flightConnectionStatus = status.connected ? 'connected' : 'failed';
      this.snackBar.open(
        `Conexion con Duffel verificada en el entorno de ${
          status.environment === 'production' ? 'produccion' : 'pruebas'
        }.`,
        'OK',
        { duration: 2400 }
      );
    } catch (error) {
      this.flightConnectionStatus = 'failed';
      this.snackBar.open(this.getFlightConnectionError(error), 'OK', {
        duration: 3000
      });
    }
  }

  async loadStaysConfig(): Promise<void> {
    this.staysConfigLoading = true;
    try {
      const config = await this.staysService.getAdminConfig();
      this.staysConfigForm.patchValue({
        enabled: config.enabled,
        environment: config.environment,
        productionToken: '',
        testToken: ''
      }, { emitEvent: false });
      this.staysSecrets = { ...config.secrets };
      this.staysConfigForm.markAsPristine();
    } catch (error) {
      this.snackBar.open(
        'No se pudo cargar la configuracion de Duffel Stays.',
        'OK',
        { duration: 2600 }
      );
    } finally {
      this.staysConfigLoading = false;
    }
  }

  async saveStaysConfig(): Promise<void> {
    if (this.staysConfigForm.invalid) {
      this.staysConfigForm.markAllAsTouched();
      this.snackBar.open('Revisa la configuracion de hoteles.', 'OK', {
        duration: 2200
      });
      return;
    }
    const value = this.staysConfigForm.getRawValue();
    this.staysConfigLoading = true;
    this.shared.setLoading(true);
    try {
      const saved = await this.staysService.saveAdminConfig({
        config: {
          enabled: value.enabled,
          environment: value.environment
        },
        productionToken: value.productionToken.trim() || undefined,
        testToken: value.testToken.trim() || undefined
      });
      this.staysConfigForm.patchValue({
        enabled: saved.enabled,
        environment: saved.environment,
        productionToken: '',
        testToken: ''
      }, { emitEvent: false });
      this.staysSecrets = { ...saved.secrets };
      this.staysConfigForm.markAsPristine();
      this.staysConnectionStatus = 'unverified';
      this.snackBar.open('Configuracion de Duffel Stays guardada.', 'OK', {
        duration: 2000
      });
    } catch (error) {
      this.snackBar.open(this.getStaysConfigError(error), 'OK', {
        duration: 3200
      });
    } finally {
      this.staysConfigLoading = false;
      this.shared.setLoading(false);
    }
  }

  async verifyStaysConnection(): Promise<void> {
    if (this.staysConfigForm.dirty) {
      this.snackBar.open(
        'Guarda la configuracion de hoteles antes de verificar la conexion.',
        'OK',
        { duration: 2800 }
      );
      return;
    }
    this.staysConnectionStatus = 'checking';
    try {
      const status = await this.staysService.verifyConnection();
      this.staysConnectionStatus = status.connected ? 'connected' : 'failed';
      this.snackBar.open(
        `Duffel Stays verificado en el entorno de ${
          status.environment === 'production' ? 'produccion' : 'pruebas'
        }.`,
        'OK',
        { duration: 2600 }
      );
    } catch (error) {
      this.staysConnectionStatus = 'failed';
      this.snackBar.open(this.getStaysConnectionError(error), 'OK', {
        duration: 3600
      });
    }
  }

  openSpeiAccountDialog(account?: SpeiAccount): void {
    this.dialog.open(AdminSpeiAccountFormDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { account }
    });
  }

  openOfficeTypeDialog(officeType?: PaymentOfficeType): void {
    this.dialog.open(AdminPaymentOfficeTypeFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { officeType }
    });
  }

  openOfficeDialog(office?: PaymentOffice): void {
    this.dialog.open(AdminPaymentOfficeFormDialogComponent, {
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      data: { office }
    });
  }

  async removeSpeiAccount(account: SpeiAccount): Promise<void> {
    const confirmed = await this.confirmDelete({
      title: 'Eliminar cuenta SPEI',
      message: `¿Deseas eliminar la cuenta "${account.label}"?`,
      confirmText: 'Eliminar cuenta',
      confirmColor: 'warn'
    });

    if (!confirmed) {
      return;
    }

    this.shared.setLoading(true);
    try {
      await this.speiAccountsService.deleteAccount(account.id);
      this.snackBar.open('Cuenta SPEI eliminada.', 'OK', { duration: 1800 });
    } catch (error) {
      this.snackBar.open('No se pudo eliminar la cuenta SPEI.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  async removeOfficeType(officeType: PaymentOfficeType): Promise<void> {
    const usageCount = this.getOfficeTypeUsageCount(officeType.id);
    if (usageCount > 0) {
      this.snackBar.open(`No puedes eliminar este tipo porque está asignado a ${usageCount} oficina(s).`, 'OK', { duration: 2400 });
      return;
    }

    const confirmed = await this.confirmDelete({
      title: 'Eliminar tipo de oficina',
      message: `¿Deseas eliminar el tipo "${officeType.name}"?`,
      confirmText: 'Eliminar tipo',
      confirmColor: 'warn'
    });

    if (!confirmed) {
      return;
    }

    this.shared.setLoading(true);
    try {
      await this.officeTypesService.deleteOfficeType(officeType.id);
      this.snackBar.open('Tipo de oficina eliminado.', 'OK', { duration: 1800 });
    } catch (error) {
      this.snackBar.open('No se pudo eliminar el tipo de oficina.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  async removeOffice(office: PaymentOffice): Promise<void> {
    const confirmed = await this.confirmDelete({
      title: 'Eliminar oficina',
      message: `¿Deseas eliminar la oficina "${office.name}"?`,
      confirmText: 'Eliminar oficina',
      confirmColor: 'warn'
    });

    if (!confirmed) {
      return;
    }

    this.shared.setLoading(true);
    try {
      await this.officesService.deleteOffice(office.id);
      this.snackBar.open('Oficina eliminada.', 'OK', { duration: 1800 });
    } catch (error) {
      this.snackBar.open('No se pudo eliminar la oficina.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  getOfficeTypeName(typeId: string): string {
    return this.officeTypeOptions.find(type => type.id === typeId)?.name || 'Sin tipo';
  }

  getOfficeTypeUsageCount(typeId: string): number {
    return this.paymentOffices.filter(office => office.typeId === typeId).length;
  }

  formatAmountRange(minAmount: number, maxAmount?: number | null): string {
    const min = this.currencyFormatter.format(Number(minAmount ?? 0));
    if (maxAmount === null || maxAmount === undefined) {
      return `${min} en adelante`;
    }
    return `${min} a ${this.currencyFormatter.format(Number(maxAmount))}`;
  }

  formatCurrency(value?: number | null, fallback: string = 'No definido'): string {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return this.currencyFormatter.format(parsed);
  }

  addOperator(event: MatChipInputEvent): void {
    this.addChip('operatorSuggestions', event);
  }

  removeOperator(value: string): void {
    this.removeChip('operatorSuggestions', value);
  }

  addInclude(event: MatChipInputEvent): void {
    this.addChip('includeSuggestions', event);
  }

  removeInclude(value: string): void {
    this.removeChip('includeSuggestions', value);
  }

  addCategory(event: MatChipInputEvent): void {
    this.addChip('categorySuggestions', event);
  }

  removeCategory(value: string): void {
    this.removeChip('categorySuggestions', value);
  }

  addExclude(event: MatChipInputEvent): void {
    this.addChip('excludeSuggestions', event);
  }

  removeExclude(value: string): void {
    this.removeChip('excludeSuggestions', value);
  }

  getOperatorSuggestions(): string[] {
    return this.getList('operatorSuggestions');
  }

  getIncludeSuggestions(): string[] {
    return this.getList('includeSuggestions');
  }

  getCategorySuggestions(): string[] {
    return this.getList('categorySuggestions');
  }

  getExcludeSuggestions(): string[] {
    return this.getList('excludeSuggestions');
  }

  private patchForm(config: TourConfig): void {
    this.configForm.patchValue({
      defaultExchangeRate: config.defaultExchangeRate,
      applyPriceMultiplier: config.applyPriceMultiplier,
      priceMultiplierPercent: config.priceMultiplierPercent,
      operatorSuggestions: [...config.operatorSuggestions],
      categorySuggestions: [...config.categorySuggestions],
      includeSuggestions: [...config.includeSuggestions],
      excludeSuggestions: [...config.excludeSuggestions]
    }, { emitEvent: false });

    const multiplier = this.configForm.get('priceMultiplierPercent');
    if (!multiplier) {
      return;
    }
    if (config.applyPriceMultiplier) {
      multiplier.enable({ emitEvent: false });
    } else {
      multiplier.disable({ emitEvent: false });
    }
  }

  private patchFlightConfigForm(config: FlightAdminConfig): void {
    this.flightConfigForm.patchValue({
      environment: config.environment,
      productionToken: '',
      testToken: '',
      usdExchangeRate: config.usdExchangeRate,
      flightsPercent: config.modifiers.flightsPercent,
      ancillariesPercent: config.modifiers.ancillariesPercent,
      seatsPercent: config.modifiers.seatsPercent
    }, { emitEvent: false });
    this.flightSecrets = { ...config.secrets };
    this.flightConfigForm.markAsPristine();
  }

  private getFlightConfigError(error: unknown): string {
    const code = error instanceof HttpErrorResponse
      ? String(error.error?.error || error.error?.message || '')
      : String((error as Error)?.message || '');
    if (code.includes('DUFFEL_LIVE_TOKEN_MISSING')) {
      return 'Agrega el token de produccion antes de activar ese entorno.';
    }
    if (code.includes('DUFFEL_TEST_TOKEN_MISSING')) {
      return 'Agrega el token de pruebas antes de activar ese entorno.';
    }
    if (code.includes('DUFFEL_LIVE_TOKEN_INVALID')) {
      return 'El token de produccion no tiene el formato esperado de Duffel.';
    }
    if (code.includes('DUFFEL_TEST_TOKEN_INVALID')) {
      return 'El token de pruebas no tiene el formato esperado de Duffel.';
    }
    return 'No se pudo guardar la configuracion de vuelos.';
  }

  private getFlightConnectionError(error: unknown): string {
    const code = error instanceof HttpErrorResponse
      ? String(error.error?.error || error.error?.message || '')
      : String((error as Error)?.message || '');
    if (code.includes('DUFFEL_LIVE_TOKEN_MISSING')) {
      return 'No hay un token de produccion guardado para verificar.';
    }
    if (code.includes('DUFFEL_TEST_TOKEN_MISSING')) {
      return 'No hay un token de pruebas guardado para verificar.';
    }
    return 'No fue posible conectar con Duffel usando el entorno activo.';
  }

  private getStaysConfigError(error: unknown): string {
    const code = error instanceof HttpErrorResponse
      ? String(error.error?.error || error.error?.message || '')
      : String((error as Error)?.message || '');
    if (code.includes('DUFFEL_STAYS_LIVE_TOKEN_MISSING')) {
      return 'Agrega el token de produccion antes de activar hoteles.';
    }
    if (code.includes('DUFFEL_STAYS_TEST_TOKEN_MISSING')) {
      return 'Agrega el token de pruebas antes de activar hoteles.';
    }
    if (code.includes('DUFFEL_LIVE_TOKEN_INVALID')) {
      return 'El token de produccion no tiene el formato esperado de Duffel.';
    }
    if (code.includes('DUFFEL_TEST_TOKEN_INVALID')) {
      return 'El token de pruebas no tiene el formato esperado de Duffel.';
    }
    return 'No se pudo guardar la configuracion de Duffel Stays.';
  }

  private getStaysConnectionError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const code = String(error.error?.error || error.error?.message || '');
      if (code.includes('DUFFEL_STAYS_LIVE_TOKEN_MISSING')) {
        return 'No hay un token de produccion de Stays guardado.';
      }
      if (code.includes('DUFFEL_STAYS_TEST_TOKEN_MISSING')) {
        return 'No hay un token de pruebas de Stays guardado.';
      }
      if (error.status === 401 || error.status === 403) {
        return 'Duffel rechazo el acceso a Stays. Confirma que el producto este habilitado en tu cuenta.';
      }
    }
    return 'No fue posible verificar Duffel Stays con el entorno activo.';
  }

  private async confirmDelete(data: ConfirmDialogData): Promise<boolean> {
    return Boolean(await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '92vw',
        data
      }).afterClosed()
    ));
  }

  private addChip(
    key: 'operatorSuggestions' | 'categorySuggestions' | 'includeSuggestions' | 'excludeSuggestions',
    event: MatChipInputEvent
  ): void {
    const value = (event.value ?? '').trim();
    if (!value) {
      event.chipInput?.clear();
      return;
    }
    const current = this.getList(key);
    if (!current.some(item => item.toLowerCase() === value.toLowerCase())) {
      this.setList(key, [...current, value]);
    }
    event.chipInput?.clear();
  }

  private removeChip(
    key: 'operatorSuggestions' | 'categorySuggestions' | 'includeSuggestions' | 'excludeSuggestions',
    value: string
  ): void {
    const current = this.getList(key);
    const next = current.filter(item => item !== value);
    this.setList(key, next);
  }

  private getList(key: 'operatorSuggestions' | 'categorySuggestions' | 'includeSuggestions' | 'excludeSuggestions'): string[] {
    return (this.configForm.get(key)?.value ?? []) as string[];
  }

  private setList(key: 'operatorSuggestions' | 'categorySuggestions' | 'includeSuggestions' | 'excludeSuggestions', value: string[]): void {
    this.configForm.get(key)?.setValue(value);
    this.configForm.markAsDirty();
  }

  private normalizeList(values: string[]): string[] {
    return values.map(item => item.trim()).filter(Boolean);
  }
}

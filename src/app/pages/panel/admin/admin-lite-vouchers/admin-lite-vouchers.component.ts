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
import { MatTabsModule } from '@angular/material/tabs';
import { firstValueFrom } from 'rxjs';
import { MetaHandlerService } from '../../../../services/meta-handler.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { DEFAULT_TOUR_CONFIG, TourConfig, XploraTourConfigService } from '../../../../services/xplora-tour-config.service';
import { XploraPaymentOfficeTypesService } from '../../../../services/xplora-payment-office-types.service';
import { XploraPaymentOfficesService } from '../../../../services/xplora-payment-offices.service';
import { XploraSpeiAccountsService } from '../../../../services/xplora-spei-accounts.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { PaymentOffice, PaymentOfficeType, SpeiAccount } from '../../../../types/payment-config.types';
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

  speiAccounts: SpeiAccount[] = [];
  officeTypeOptions: PaymentOfficeType[] = [];
  paymentOffices: PaymentOffice[] = [];
  speiCoverageWarnings: string[] = [];

  constructor(
    private meta: MetaHandlerService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private configService: XploraTourConfigService,
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

    this.officeTypesService.watchOfficeTypes().subscribe((types) => {
      this.officeTypeOptions = [...(types ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    });

    this.officesService.watchOffices().subscribe((offices) => {
      this.paymentOffices = [...(offices ?? [])].sort((a, b) => a.name.localeCompare(b.name));
    });
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

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Timestamp } from '@angular/fire/firestore';
import { SharedDataService } from '../../../../services/shared-data.service';
import { Promo, XploraPromosService } from '../../../../services/xplora-promos.service';
import { UppercaseDirective } from '../../../../uppercase.directive';
import { XploraBottomSheetComponent } from '../../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

export interface AdminPromoSheetData {
  promo?: Promo;
}

@Component({
  selector: 'app-admin-promos-form-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule,
    UppercaseDirective,
    XploraBottomSheetComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './admin-promos-form-sheet.component.html',
  styleUrl: './admin-promos-form-sheet.component.scss'
})
export class AdminPromosFormSheetComponent {
  form: FormGroup;
  editingPromoID?: string;

  readonly discountTypes: { id: Promo['discountType']; label: string }[] = [
    { id: 'percentage', label: 'Porcentaje' },
    { id: 'fixed', label: 'Monto fijo' }
  ];
  readonly allowedProducts: { id: Promo['allowedProducts']; label: string }[] = [
    { id: 'flights', label: 'Vuelos' },
    { id: 'hotels', label: 'Hoteles' },
    { id: 'all', label: 'Todos' }
  ];
  readonly applyTo: { id: Promo['applyTo']; label: string }[] = [
    { id: 'tax', label: 'Impuestos' },
    { id: 'total', label: 'Total' },
    { id: 'base', label: 'Base' },
    { id: 'extras', label: 'Adicionales' },
    { id: 'seats', label: 'Asientos' },
    { id: 'upgrade', label: 'Upgrade' }
  ];

  constructor(
    private fb: FormBuilder,
    private promos: XploraPromosService,
    private shared: SharedDataService,
    private snackBar: MatSnackBar,
    private sheetRef: MatBottomSheetRef<AdminPromosFormSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data?: AdminPromoSheetData
  ) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(6)]],
      discountType: ['percentage', Validators.required],
      discountAmount: [0, [Validators.required, Validators.min(0)]],
      expiryDate: [null, Validators.required],
      minPurchaseAmount: [0, [Validators.required, Validators.min(0)]],
      allowedProducts: ['flights', Validators.required],
      applyTo: ['total', Validators.required],
      isActive: [true],
      tyc: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (data?.promo) {
      this.editingPromoID = data.promo.promoID;
      const expiryDate = data.promo.expiryDate instanceof Timestamp
        ? data.promo.expiryDate.toDate()
        : new Date(data.promo.expiryDate as Date);
      this.form.patchValue({
        code: data.promo.code,
        description: data.promo.description,
        discountType: data.promo.discountType,
        discountAmount: data.promo.discountAmount,
        expiryDate,
        minPurchaseAmount: data.promo.minPurchaseAmount,
        allowedProducts: data.promo.allowedProducts,
        applyTo: data.promo.applyTo,
        isActive: data.promo.isActive,
        tyc: data.promo.tyc
      });
    }
  }

  close() {
    this.sheetRef.dismiss();
  }

  async savePromo() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos.', 'OK', { duration: 1800 });
      return;
    }
    this.shared.setLoading(true);
    try {
      const value = this.form.value;
      const expiry = value.expiryDate instanceof Timestamp
        ? value.expiryDate
        : Timestamp.fromDate(new Date(value.expiryDate));

      const promo: Promo = {
        code: String(value.code).trim().toUpperCase(),
        description: String(value.description).trim(),
        discountType: value.discountType,
        discountAmount: Number(value.discountAmount),
        expiryDate: expiry,
        minPurchaseAmount: Number(value.minPurchaseAmount),
        allowedProducts: value.allowedProducts,
        applyTo: value.applyTo,
        isActive: Boolean(value.isActive),
        tyc: String(value.tyc).trim()
      };

      if (this.editingPromoID) {
        await this.promos.editPromo(this.editingPromoID, promo);
        this.snackBar.open('Promoción actualizada correctamente.', 'OK', { duration: 1800 });
      } else {
        await this.promos.addPromo(promo);
        this.snackBar.open('Promoción creada correctamente.', 'OK', { duration: 1800 });
      }
      this.sheetRef.dismiss(true);
    } catch (error) {
      const message = this.editingPromoID
        ? 'No se pudo actualizar la promoción.'
        : 'No se pudo crear la promoción.';
      this.snackBar.open(message, 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }
}

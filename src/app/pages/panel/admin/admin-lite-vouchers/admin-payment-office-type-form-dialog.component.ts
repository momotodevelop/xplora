import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedDataService } from '../../../../services/shared-data.service';
import { XploraPaymentOfficeTypesService } from '../../../../services/xplora-payment-office-types.service';
import { PaymentOfficeType } from '../../../../types/payment-config.types';
import { buildPaymentOfficeTypeForm, normalizePaymentOfficeType } from './admin-payment-config-form.utils';

export interface AdminPaymentOfficeTypeFormDialogData {
  officeType?: PaymentOfficeType;
}

@Component({
  selector: 'app-admin-payment-office-type-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-payment-office-type-form-dialog.component.html',
  styleUrl: './admin-payment-office-type-form-dialog.component.scss'
})
export class AdminPaymentOfficeTypeFormDialogComponent {
  readonly form = buildPaymentOfficeTypeForm(this.fb, this.data?.officeType);

  constructor(
    private fb: FormBuilder,
    private officeTypesService: XploraPaymentOfficeTypesService,
    private shared: SharedDataService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AdminPaymentOfficeTypeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: AdminPaymentOfficeTypeFormDialogData
  ) {}

  get isEditing(): boolean {
    return Boolean(this.data?.officeType?.id);
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos del tipo de oficina.', 'OK', { duration: 1800 });
      return;
    }

    this.shared.setLoading(true);
    try {
      const officeType = normalizePaymentOfficeType(this.form.getRawValue() as PaymentOfficeType);
      const id = await this.officeTypesService.saveOfficeType(officeType);
      this.snackBar.open(this.isEditing ? 'Tipo de oficina actualizado.' : 'Tipo de oficina creado.', 'OK', { duration: 1800 });
      this.dialogRef.close({ saved: true, id });
    } catch (error) {
      this.snackBar.open('No se pudo guardar el tipo de oficina.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }
}

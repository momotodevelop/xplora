import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SharedDataService } from '../../../../services/shared-data.service';
import { XploraSpeiAccountsService } from '../../../../services/xplora-spei-accounts.service';
import { SpeiAccount } from '../../../../types/payment-config.types';
import { buildSpeiAccountForm, normalizeSpeiAccount } from './admin-payment-config-form.utils';

export interface AdminSpeiAccountFormDialogData {
  account?: SpeiAccount;
}

@Component({
  selector: 'app-admin-spei-account-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-spei-account-form-dialog.component.html',
  styleUrl: './admin-spei-account-form-dialog.component.scss'
})
export class AdminSpeiAccountFormDialogComponent {
  readonly form = buildSpeiAccountForm(this.fb, this.data?.account);

  constructor(
    private fb: FormBuilder,
    private speiAccountsService: XploraSpeiAccountsService,
    private shared: SharedDataService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AdminSpeiAccountFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: AdminSpeiAccountFormDialogData
  ) {}

  get isEditing(): boolean {
    return Boolean(this.data?.account?.id);
  }

  close(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos de la cuenta SPEI.', 'OK', { duration: 1800 });
      return;
    }

    this.shared.setLoading(true);
    try {
      const account = normalizeSpeiAccount(this.form.getRawValue() as SpeiAccount);
      const id = await this.speiAccountsService.saveAccount(account);
      this.snackBar.open(this.isEditing ? 'Cuenta SPEI actualizada.' : 'Cuenta SPEI creada.', 'OK', { duration: 1800 });
      this.dialogRef.close({ saved: true, id });
    } catch (error) {
      this.snackBar.open('No se pudo guardar la cuenta SPEI.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }
}

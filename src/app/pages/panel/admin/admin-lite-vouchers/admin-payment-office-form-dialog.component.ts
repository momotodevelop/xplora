import { CommonModule } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, firstValueFrom } from 'rxjs';
import { SharedDataService } from '../../../../services/shared-data.service';
import { XploraPaymentOfficeTypesService } from '../../../../services/xplora-payment-office-types.service';
import { XploraPaymentOfficesService } from '../../../../services/xplora-payment-offices.service';
import { AdminMediaLibrarySheetComponent } from '../../../../shared/admin-media-library-sheet/admin-media-library-sheet.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import {
  PaymentOffice,
  PaymentOfficeType,
  PaymentStepElement,
  PaymentStepElementType
} from '../../../../types/payment-config.types';
import {
  PAYMENT_LINK_STYLE_OPTIONS,
  buildPaymentOfficeForm,
  buildPaymentOfficeStepForm,
  buildPaymentStepElementForm,
  getPaymentOfficeStepElementsArray,
  getPaymentOfficeStepsArray,
  normalizePaymentOffice
} from './admin-payment-config-form.utils';
import { AdminPaymentOfficeTypeFormDialogComponent } from './admin-payment-office-type-form-dialog.component';

export interface AdminPaymentOfficeFormDialogData {
  office?: PaymentOffice;
}

@Component({
  selector: 'app-admin-payment-office-form-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-payment-office-form-dialog.component.html',
  styleUrl: './admin-payment-office-form-dialog.component.scss'
})
export class AdminPaymentOfficeFormDialogComponent implements OnInit, OnDestroy {
  readonly form = buildPaymentOfficeForm(this.fb, this.data?.office);
  readonly linkStyleOptions = PAYMENT_LINK_STYLE_OPTIONS;
  officeTypeOptions: PaymentOfficeType[] = [];
  private readonly subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private officesService: XploraPaymentOfficesService,
    private officeTypesService: XploraPaymentOfficeTypesService,
    private shared: SharedDataService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private dialogRef: MatDialogRef<AdminPaymentOfficeFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data?: AdminPaymentOfficeFormDialogData
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.officeTypesService.watchOfficeTypes().subscribe((types) => {
        this.officeTypeOptions = [...(types ?? [])].sort((a, b) => a.name.localeCompare(b.name));
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isEditing(): boolean {
    return Boolean(this.data?.office?.id);
  }

  get stepsArray(): FormArray {
    return getPaymentOfficeStepsArray(this.form);
  }

  getStepElements(stepIndex: number): FormArray {
    return getPaymentOfficeStepElementsArray(this.stepsArray.at(stepIndex) as FormGroup);
  }

  close(): void {
    this.dialogRef.close();
  }

  addStep(): void {
    this.stepsArray.push(buildPaymentOfficeStepForm(this.fb));
    this.form.markAsDirty();
  }

  async removeStep(stepIndex: number): Promise<void> {
    const confirmed = await this.confirmDelete(
      'Eliminar paso',
      `¿Deseas eliminar el paso ${stepIndex + 1}?`,
      'Eliminar paso'
    );
    if (!confirmed) {
      return;
    }
    this.stepsArray.removeAt(stepIndex);
    this.form.markAsDirty();
  }

  addStepElement(stepIndex: number, type: PaymentStepElementType): void {
    this.getStepElements(stepIndex).push(buildPaymentStepElementForm(this.fb, { type } as PaymentStepElement));
    this.form.markAsDirty();
  }

  async removeStepElement(stepIndex: number, elementIndex: number): Promise<void> {
    const confirmed = await this.confirmDelete(
      'Eliminar elemento',
      `¿Deseas eliminar este elemento del paso ${stepIndex + 1}?`,
      'Eliminar elemento'
    );
    if (!confirmed) {
      return;
    }
    this.getStepElements(stepIndex).removeAt(elementIndex);
    this.form.markAsDirty();
  }

  openImageLibrary(control: AbstractControl | null, title: string): void {
    if (!control) {
      return;
    }

    const sheetRef = this.bottomSheet.open(AdminMediaLibrarySheetComponent, {
      panelClass: 'custom-bottom-sheet',
      data: {
        title,
        selectedUrl: String(control.value ?? '').trim()
      }
    });

    sheetRef.afterDismissed().subscribe((selectedUrl?: string) => {
      if (!selectedUrl || selectedUrl === control.value) {
        return;
      }
      control.setValue(selectedUrl);
      control.markAsDirty();
      this.form.markAsDirty();
    });
  }

  openCreateOfficeTypeDialog(): void {
    const typeDialogRef = this.dialog.open(AdminPaymentOfficeTypeFormDialogComponent, {
      width: '540px',
      maxWidth: '95vw'
    });

    typeDialogRef.afterClosed().subscribe((result?: { id?: string }) => {
      if (!result?.id) {
        return;
      }
      this.form.get('typeId')?.setValue(result.id);
      this.form.get('typeId')?.markAsDirty();
      this.form.markAsDirty();
    });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos de la oficina.', 'OK', { duration: 1800 });
      return;
    }

    if (this.officeTypeOptions.length === 0) {
      this.snackBar.open('Debes crear al menos un tipo de oficina antes de guardar.', 'OK', { duration: 2000 });
      return;
    }

    const typeId = String(this.form.get('typeId')?.value ?? '').trim();
    if (!this.officeTypeOptions.some(type => type.id === typeId)) {
      this.snackBar.open('Selecciona un tipo de oficina válido.', 'OK', { duration: 1800 });
      return;
    }

    this.shared.setLoading(true);
    try {
      const office = normalizePaymentOffice(this.form.getRawValue() as PaymentOffice);
      const id = await this.officesService.saveOffice(office);
      this.snackBar.open(this.isEditing ? 'Oficina actualizada.' : 'Oficina creada.', 'OK', { duration: 1800 });
      this.dialogRef.close({ saved: true, id });
    } catch (error) {
      this.snackBar.open('No se pudo guardar la oficina.', 'OK', { duration: 2000 });
    } finally {
      this.shared.setLoading(false);
    }
  }

  private async confirmDelete(title: string, message: string, confirmText: string): Promise<boolean> {
    return Boolean(await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '92vw',
        data: {
          title,
          message,
          confirmText,
          cancelText: 'Cancelar',
          confirmColor: 'warn'
        }
      }).afterClosed()
    ));
  }
}

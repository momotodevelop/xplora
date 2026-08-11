import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';
import { StorageMediaItem, StorageService } from '../../services/storage.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface AdminMediaLibrarySheetData {
  title?: string;
  selectedUrl?: string;
  allowDelete?: boolean;
}

@Component({
  selector: 'app-admin-media-library-sheet',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatBottomSheetModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    XploraBottomSheetComponent
  ],
  templateUrl: './admin-media-library-sheet.component.html',
  styleUrl: './admin-media-library-sheet.component.scss'
})
export class AdminMediaLibrarySheetComponent implements OnInit {
  mediaItems: StorageMediaItem[] = [];
  loading = true;
  uploadProgress: number | null = null;
  uploading = false;
  deletingPath = '';

  constructor(
    private sheetRef: MatBottomSheetRef<AdminMediaLibrarySheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: AdminMediaLibrarySheetData,
    private storageService: StorageService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMedia();
  }

  close(): void {
    this.sheetRef.dismiss();
  }

  selectMedia(item: StorageMediaItem): void {
    this.sheetRef.dismiss(item.url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Solo se permiten imagenes.', 'OK', { duration: 1800 });
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;
    this.storageService.uploadAdminMedia(file).subscribe({
      next: value => {
        if (typeof value === 'number') {
          this.uploadProgress = value;
          return;
        }
        this.uploading = false;
        this.uploadProgress = null;
        this.snackBar.open('Imagen subida a la biblioteca.', 'OK', { duration: 1800 });
        this.loadMedia();
      },
      error: () => {
        this.uploading = false;
        this.uploadProgress = null;
        this.snackBar.open('No se pudo subir la imagen.', 'OK', { duration: 1800 });
      }
    });
  }

  async deleteMedia(item: StorageMediaItem): Promise<void> {
    if (!this.canDelete(item)) {
      return;
    }
    const confirmed = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        maxWidth: '92vw',
        data: {
          title: 'Eliminar imagen',
          message: `¿Deseas eliminar "${item.name}" de la biblioteca?`,
          confirmText: 'Eliminar imagen',
          cancelText: 'Cancelar',
          confirmColor: 'warn'
        }
      }).afterClosed()
    );
    if (!confirmed) {
      return;
    }
    this.deletingPath = item.fullPath;
    try {
      await this.storageService.deleteMedia(item.fullPath);
      this.mediaItems = this.mediaItems.filter(current => current.fullPath !== item.fullPath);
      this.snackBar.open('Imagen eliminada.', 'OK', { duration: 1800 });
    } catch (error) {
      this.snackBar.open('No se pudo eliminar la imagen.', 'OK', { duration: 1800 });
    } finally {
      this.deletingPath = '';
    }
  }

  isSelected(item: StorageMediaItem): boolean {
    return String(this.data?.selectedUrl ?? '').trim() === item.url;
  }

  canDelete(item: StorageMediaItem): boolean {
    return this.data?.allowDelete !== false && this.deletingPath !== item.fullPath;
  }

  private async loadMedia(): Promise<void> {
    this.loading = true;
    try {
      this.mediaItems = await this.storageService.listAdminMedia();
    } catch (error) {
      this.mediaItems = [];
      this.snackBar.open('No se pudo cargar la biblioteca de imagenes.', 'OK', { duration: 2000 });
    } finally {
      this.loading = false;
    }
  }
}

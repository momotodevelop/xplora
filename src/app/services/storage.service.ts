import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  getMetadata,
  listAll,
  ref,
  uploadBytesResumable
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface StorageMediaItem {
  name: string;
  fullPath: string;
  url: string;
  updatedAt?: Date;
  size?: number;
  contentType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly adminMediaRoot = 'admin-media';

  constructor(private storage: Storage, private auth: Auth) { }

  uploadFile(file: File, path: string): Observable<number | string> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable(observer => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Observar eventos de progreso
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next(progress); // Emitir el progreso como un número
        },
        (error) => {
          // Manejar errores
          console.error('Error al subir el archivo:', error);
          observer.error(error);
        },
        () => {
          // Subida completada con éxito, obtener URL de descarga
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            observer.next(downloadURL); // Emitir la URL como una cadena
            observer.complete();
          });
        }
      );
    });
  }

  uploadAdminMedia(file: File, uid?: string): Observable<number | string> {
    const ownerUid = this.getRequiredUid(uid);
    const sanitizedName = this.sanitizeFileName(file.name);
    const path = `${this.adminMediaRoot}/${ownerUid}/${Date.now()}-${sanitizedName}`;
    return this.uploadFile(file, path);
  }

  async listAdminMedia(uid?: string): Promise<StorageMediaItem[]> {
    const ownerUid = this.getRequiredUid(uid);
    const rootRef = ref(this.storage, `${this.adminMediaRoot}/${ownerUid}`);
    const result = await listAll(rootRef);
    const items = await Promise.all(result.items.map(async item => {
      const [url, metadata] = await Promise.all([
        getDownloadURL(item),
        getMetadata(item)
      ]);
      const contentType = metadata.contentType ?? '';
      if (contentType && !contentType.startsWith('image/')) {
        return null;
      }
      return {
        name: item.name,
        fullPath: item.fullPath,
        url,
        updatedAt: metadata.updated ? new Date(metadata.updated) : undefined,
        size: metadata.size,
        contentType: metadata.contentType ?? undefined
      } as StorageMediaItem;
    }));

    return items
      .filter(Boolean)
      .sort((a, b) => {
        const left = a?.updatedAt?.getTime() ?? 0;
        const right = b?.updatedAt?.getTime() ?? 0;
        return right - left;
      }) as StorageMediaItem[];
  }

  async deleteMedia(fullPath: string): Promise<void> {
    if (!fullPath.trim()) {
      return;
    }
    await deleteObject(ref(this.storage, fullPath));
  }

  private getRequiredUid(uid?: string): string {
    const ownerUid = String(uid ?? this.auth.currentUser?.uid ?? '').trim();
    if (!ownerUid) {
      throw new Error('No hay un usuario autenticado para administrar la media.');
    }
    return ownerUid;
  }

  private sanitizeFileName(name: string): string {
    return String(name ?? 'archivo')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .toLowerCase() || 'archivo';
  }
}

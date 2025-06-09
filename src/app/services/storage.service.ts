// src/app/services/storage.service.ts
import { Injectable } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private storage: Storage) { }

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
}
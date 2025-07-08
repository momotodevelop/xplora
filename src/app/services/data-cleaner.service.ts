// src/app/services/data-cleaner.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataCleanerService {

  constructor() { }

  /**
   * Elimina recursivamente todas las propiedades con valor `undefined` de un objeto.
   * También filtra elementos `undefined` de los arrays.
   *
   * @param obj El objeto (o array) a limpiar.
   * @returns Un nuevo objeto (o array) sin propiedades/elementos `undefined`.
   */
  removeUndefined<T>(obj: T): T {
    // Si no es un objeto o es null, lo devolvemos tal cual.
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Si es un array, procesamos cada elemento recursivamente y filtramos los undefined.
    if (Array.isArray(obj)) {
      // Usamos 'as T[]' para mantener la tipificación del array original.
      return obj
        .map((item: any) => this.removeUndefined(item))
        .filter((item: any) => item !== undefined) as T;
    }

    // Si es un objeto, iteramos sobre sus propiedades.
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      // Aseguramos que la propiedad pertenece al objeto y no a su prototipo.
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = (obj as any)[key]; // Accedemos al valor.

        // Si el valor no es undefined...
        if (value !== undefined) {
          // Si el valor es un objeto (y no null), lo limpiamos recursivamente.
          if (typeof value === 'object' && value !== null) {
            const cleanedValue = this.removeUndefined(value);
            // Solo añadimos la propiedad si el valor limpiado no es undefined.
            // Esto es útil si un objeto anidado se limpia a un estado completamente vacío (si eso fuera necesario).
            if (cleanedValue !== undefined) {
              newObj[key] = cleanedValue;
            }
          } else {
            // Si no es un objeto o es null, lo añadimos directamente.
            newObj[key] = value;
          }
        }
      }
    }
    // Devolvemos el nuevo objeto limpiado, manteniendo su tipo.
    return newObj as T;
  }
}
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisitCounterService {
  private storageKey = 'visitCounts';
  constructor() {}
  incrementHotelVisit(hotelId: string): number {
    let visitCounts = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    // Si la URL no está en el registro, inicialízala en 0
    if (!visitCounts[hotelId]) {
      visitCounts[hotelId] = 0;
    }
    // Incrementar el contador de visitas
    visitCounts[hotelId]++;
    // Guardar en el localStorage
    localStorage.setItem(this.storageKey, JSON.stringify(visitCounts));
    return visitCounts[hotelId];
  }
  getVisitCount(hotelId: string): number {
    const visitCounts = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    return visitCounts[hotelId] || 0;
  }
}

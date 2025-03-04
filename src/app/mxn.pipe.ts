import { Pipe, PipeTransform } from '@angular/core';
import { HotelHandlerService } from './services/hotel-handler.service';

@Pipe({
  name: 'MXN'
})
export class MxnPipe implements PipeTransform {
  constructor(private hotel: HotelHandlerService){}
  transform(value: number | string, currencyOrRate: string | number): number {
    // Convertir a número si el valor es una cadena
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Validar que el valor convertido sea un número válido
    if (isNaN(numericValue)) {
      throw new Error('El valor debe ser un número válido o una cadena que represente un número.');
    }

    let conversionRate: number;

    if (typeof currencyOrRate === 'string') {
      // Si se pasa una divisa, buscar el factor de conversión
      conversionRate = this.hotel.getRateConversion(currencyOrRate.toUpperCase()) || 1;
    } else if (typeof currencyOrRate === 'number') {
      // Si se pasa un número, usarlo directamente como factor de conversión
      conversionRate = currencyOrRate;
    } else {
      throw new Error('El segundo argumento debe ser un string o un número.');
    }

    // Aplicar la conversión
    return Math.round(numericValue * conversionRate);
  }
}

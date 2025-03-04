import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hotelPrice'
})
export class HotelPriceManagerPipe implements PipeTransform {
  transform(value: number | string, discount: number = 0, round: boolean = true): number {
    // Convertir a número si el valor es una cadena
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;

    // Validar que el valor convertido sea un número válido
    if (isNaN(numericValue)) {
      throw new Error('El valor debe ser un número válido o una cadena que represente un número.');
    }

    // Aplicar el descuento
    const discountedPrice = numericValue - (numericValue * (discount / 100));

    // Redondear si es necesario
    return round ? Math.round(discountedPrice) : discountedPrice;
  }
}

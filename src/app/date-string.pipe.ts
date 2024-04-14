import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'dateString',
  standalone: true
})
export class DateStringPipe implements PipeTransform {

  constructor(private datePipe: DatePipe) {}

  transform(value: string, format: string = 'mediumDate'): string {
    // Convierte el string a un objeto Date
    const date = new Date(value);
    // Usa DatePipe para transformar la fecha al formato deseado
    return this.datePipe.transform(date, format) || '';
  }
}

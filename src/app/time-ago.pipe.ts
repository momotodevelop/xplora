// src/app/pipes/time-ago.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { format, isThisMonth, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: Timestamp): string {
    if (!value) return '';

    const now = new Date();
    const date = value.toDate();

    const minutes = differenceInMinutes(now, date);
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);

    if (minutes < 1) return 'Justo ahora';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} hrs`;
    if (days < 7) return `${days} días`;

    // Si sigue siendo este mes pero más de una semana, mostrar días
    if (isThisMonth(date)) return `${days} días`;

    // Si es de otro mes, mostrar fecha completa
    return format(date, 'dd MMM yyyy');
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'initial',
  standalone: true
})
export class InitialPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase();
  }

}
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cityName'
})
export class CityNamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}

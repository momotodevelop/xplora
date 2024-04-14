import { Pipe, PipeTransform } from '@angular/core';
import { flightClasses } from './pages/flight-search/search-topbar/search-topbar.component';



@Pipe({
  name: 'flightClassName',
  standalone: true
})
export class FlightClassNamePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    if (!value ) {
      return '';
    }
    console.log(value);
    const found = flightClasses.find(item => item.id === value);
    return found? found.name : "CABINA DESC.";
  }

}

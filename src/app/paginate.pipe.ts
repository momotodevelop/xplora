import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paginate',
  standalone: true
})
export class PaginatePipe implements PipeTransform {

  transform(array: any[], pageSize: number|null, pageNumber: number|null): any[] {
    if (!array || array.length === 0) return [];
    const size = pageSize ?? 5;
    const startIndex = ((pageNumber ?? 1) - 1) * size;
    return array.slice(startIndex, startIndex + size);
  }

}

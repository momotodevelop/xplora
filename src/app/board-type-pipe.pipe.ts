import { Pipe, PipeTransform } from '@angular/core';
import { BoardTypeDictionarie } from './static/board-types.static';

@Pipe({
  name: 'boardType'
})
export class BoardTypePipe implements PipeTransform {
  transform(id: string, name: string): string {
    return BoardTypeDictionarie.find(bt => bt.id === id)?.es ?? name;
  }
}

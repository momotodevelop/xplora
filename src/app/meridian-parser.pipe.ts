import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'meridianParser',
  standalone: true
})
export class RemoveCharactersPipe implements PipeTransform {
  transform(value: string|null): string {
    if(value==='a. m.'){
      return 'am'
    }else if(value==="p. m."){
      return 'pm';
    }else{
      return '';
    }
  }
}

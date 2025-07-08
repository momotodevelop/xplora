import { Component, OnChanges, SimpleChanges, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-terms-text',
  imports: [],
  templateUrl: './terms-text.component.html',
  styleUrl: './terms-text.component.scss'
})
export class TermsTextComponent implements OnChanges {
  @Input() activeSection:string = '';
  constructor(private el: ElementRef){

  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes){
      //console.log(changes);
      if(changes['activeSection']){
        const change = changes['activeSection'];
        if(change.currentValue!==change.previousValue){
          this.scrollToElemento(change.currentValue);
        }
      }
    }
  }
  scrollToElemento(id:string) {
    const elemento = this.el.nativeElement.querySelector('#'+id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

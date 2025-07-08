import { Component, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-privacy-text',
  imports: [],
  templateUrl: './privacy-text.component.html',
  styleUrl: './privacy-text.component.scss'
})
export class PrivacyTextComponent implements OnChanges {
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
import { Component, OnChanges, SimpleChanges, ElementRef, Inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-terms-text',
  imports: [],
  templateUrl: './terms-text.component.html',
  styleUrl: './terms-text.component.scss'
})
export class TermsTextComponent implements OnChanges {
  @Input() activeSection:string = '';
  private readonly isBrowser: boolean;

  constructor(private el: ElementRef<HTMLElement>, @Inject(PLATFORM_ID) platformId: Object){
    this.isBrowser = isPlatformBrowser(platformId);
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
    if (!this.isBrowser || !id) {
      return;
    }

    const root = this.el.nativeElement;
    const elemento = root.ownerDocument?.getElementById(id);
    if (elemento && root.contains(elemento)) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

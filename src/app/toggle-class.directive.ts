import { Directive, ElementRef, AfterViewInit, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[data-x-click]',
  standalone: true
})
export class ToggleClassDirective implements AfterViewInit, OnDestroy {
  private clickListener: (() => void) | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngAfterViewInit() {
    this.init();
    console.log("Toggle class")
  }

  ngOnDestroy() {
    if (this.clickListener) {
      this.clickListener();
    }
  }

  private init() {
    const eventTarget = this.el.nativeElement;
    const attributes = eventTarget.getAttribute('data-x-click')?.split(', ');

    if (attributes) {
      attributes.forEach((el:string) => {
        const target = document.querySelector(`[data-x=${el}]`);
        if (target) {
          this.clickListener = this.renderer.listen(eventTarget, 'click', () => {
            const toggleClass = target.getAttribute('data-x-toggle');
            if (toggleClass) {
              target.classList.toggle(toggleClass);
            }
          });
        }
      });
    }
  }
}
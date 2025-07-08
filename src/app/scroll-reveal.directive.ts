import { Directive, ElementRef, OnInit, OnDestroy, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]'
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  private observer!: IntersectionObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window) {
      const options = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.01
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const nativeElement = this.el.nativeElement;
            this.renderer.addClass(nativeElement, 'is-in-view');
            console.log("is-in-view");

            if (nativeElement.hasAttribute('data-anim-wrap')) {
              this.renderer.addClass(nativeElement, 'animated');
              const animChilds = nativeElement.querySelectorAll('[data-anim-child]');
              animChilds.forEach((child: HTMLElement) => {
                this.renderer.addClass(child, 'is-in-view');
              });
            }

            this.observer.unobserve(nativeElement);
          }
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    } else {
      // Si no hay IntersectionObserver (SSR o browser viejo), aplica clase directamente
      this.renderer.addClass(this.el.nativeElement, 'is-in-view');
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

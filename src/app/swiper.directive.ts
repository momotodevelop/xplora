import { Directive, AfterViewInit, ElementRef, Input, inject, PLATFORM_ID } from '@angular/core';
import { SwiperOptions } from 'swiper/types';
import { isPlatformBrowser } from '@angular/common';

@Directive({ selector: '[appSwiper]', standalone: true })
export class SwiperDirective implements AfterViewInit {
  @Input() config?: SwiperOptions;
  private el = inject(ElementRef<HTMLElement>).nativeElement;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    Object.assign(this.el, this.config);
    if (isPlatformBrowser(this.platformId)) {
      (this.el as any).initialize();
    }
  }
}

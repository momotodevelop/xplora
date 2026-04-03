import { Component, OnInit } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { AmavComponent } from '../about/amav/amav.component';
import { IataComponent } from '../about/iata/iata.component';
import { SecturComponent } from '../about/sectur/sectur.component';
import { TripadvisorComponent } from '../about/tripadvisor/tripadvisor.component';
import { SharedDataService } from '../../services/shared-data.service';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';
import { SlickConfig } from '../../types/slick.types';

@Component({
  selector: 'app-confianza',
  imports: [MatBottomSheetModule, ScrollRevealDirective, SlickCarouselModule],
  templateUrl: './confianza.component.html',
  styleUrl: './confianza.component.scss'
})
export class ConfianzaComponent implements OnInit {
  sliderImages = [
    { src: '/assets/img/pages/confianza/2.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/4.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/5.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/6.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/7.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/8.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/10.jpg', alt: 'Xplora Travel' },
  ];
  featuredImages = [
    { src: '/assets/img/pages/confianza/1.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/9.jpg', alt: 'Xplora Travel' },
    { src: '/assets/img/pages/confianza/3.jpg', alt: 'Xplora Travel' },
  ]
  sliderConfig: SlickConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 1500,
    pauseOnHover: true,
    accessibility: true
  };

  constructor(private bs: MatBottomSheet, private shared: SharedDataService, private meta: MetaHandlerService) {}

  ngOnInit(): void {
    this.shared.changeHeaderType('dark');
    this.meta.setMeta({
      title: 'Xplora Travel || Xplora Travel es confiable?',
      description: 'Descubre las razones por las que Xplora Travel es una empresa segura: procesos transparentes, pagos protegidos y acompanamiento real en cada etapa de tu viaje.',
      image: 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fhelp.jpg?alt=media&token=13d17f4c-fcb5-4f20-b36f-93c66e1634a4'
    });
  }

  openTA() {
    this.bs.open(TripadvisorComponent, { panelClass: 'bottomsheet-no-padding' });
  }

  openRNT() {
    this.bs.open(SecturComponent, { panelClass: 'bottomsheet-no-padding' });
  }

  openAMAV() {
    this.bs.open(AmavComponent, { panelClass: 'bottomsheet-no-padding' });
  }

  openIATA() {
    this.bs.open(IataComponent, { panelClass: 'bottomsheet-no-padding' });
  }
}

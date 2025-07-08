import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAndroid, faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { SharedDataService } from '../../services/shared-data.service';

export interface FooterLink {
  url: string;
  isBlank: boolean;
  title: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Sobre Nosotros',
    links: [
      { url: '/nosotros', isBlank: false, title: 'Quiénes Somos' },
      { url: '/nosotros', isBlank: false, title: 'Misión y Visión' },
      { url: '/nosotros', isBlank: false, title: 'Sustentabilidad' },
      { url: '/privacidad', isBlank: false, title: 'Política de Privacidad' },
      { url: '/terminos-condiciones', isBlank: false, title: 'Términos y Condiciones' },
      { url: '/inicio', isBlank: false, title: 'Trabaja con Nosotros' },
    ],
  },
  {
    title: 'Servicios',
    links: [
      { url: '/inicio', isBlank: false, title: 'Reservación de Vuelos' },
      { url: '/inicio', isBlank: false, title: 'Hoteles y Hospedaje' },
      { url: '/inicio', isBlank: false, title: 'Tours y Experiencias' },
      { url: '/inicio', isBlank: false, title: 'Paquetes de Viaje' },
      { url: '/inicio', isBlank: false, title: 'Traslados y Transportación' },
      { url: '/inicio', isBlank: false, title: 'Servicio de Concierge' },
    ],
  },
  {
    title: 'Ayuda y Contacto',
    links: [
      { url: '/preguntas-frecuentes', isBlank: false, title: 'Preguntas Frecuentes (FAQ)' },
      { url: '/contacto', isBlank: false, title: 'Atención a Clientes' },
      { url: 'https://wa.me/message/CQ2PXT6E2G7AL1', isBlank: false, title: 'Confirmar Servicios' },
      { url: 'https://wa.me/message/LWXPVPX4H547I1', isBlank: true, title: 'Atención en el Aeropuerto' },
      { url: '/contacto', isBlank: false, title: 'Contáctanos' },
    ],
  },
];

@Component({
  selector: 'app-footer',
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, AfterViewInit {
  minFooter = false;
  androidIcon = faAndroid;
  fbIcon = faFacebook;
  igIcon = faInstagram;
  waIcon = faWhatsapp;
  year = new Date().getFullYear();
  columns: FooterColumn[] = footerColumns;

  @ViewChild('footer', { read: ElementRef, static: false }) footerElement?: ElementRef;

  constructor(
    private shared: SharedDataService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  ngOnInit(): void {
    this.shared.minFooter.subscribe(booking => {
      this.minFooter = booking;
      this.updateFooterHeight();
    });
  }

  ngAfterViewInit(): void {
    this.updateFooterHeight();
  }

  private updateFooterHeight(): void {
    if (isPlatformBrowser(this.platformId) && this.footerElement?.nativeElement) {
      this.shared.changeFooterHeight(this.footerElement.nativeElement.offsetHeight);
    }
  }
}

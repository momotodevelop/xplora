import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAndroid, faFacebook, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { SharedDataService } from '../../services/shared-data.service';
import { WhatsAppUrlManagerService } from '../../services/whatsapp-url-manager.service';

export interface FooterLink {
  url: string;
  isBlank: boolean;
  title: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

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
  dashboard = false;
  columns: FooterColumn[];

  @ViewChild('footer', { read: ElementRef, static: false }) footerElement?: ElementRef;

  constructor(
    private wa: WhatsAppUrlManagerService,
    private shared: SharedDataService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {
    this.columns = [
      {
        title: 'Sobre Nosotros',
        links: [
          { url: '/nosotros', isBlank: false, title: 'Quiénes Somos' },
          { url: '/nosotros', isBlank: false, title: 'Misión y Visión' },
          { url: '/nosotros', isBlank: false, title: 'Sustentabilidad' },
          { url: '/confianza', isBlank: false, title: 'Confianza' },
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
          { url: this.wa.getUrlFromTemplate('confirmarReservacion'), isBlank: false, title: 'Confirmar Servicios' },
          { url: this.wa.getUrlFromTemplate('ayudaAeropuerto'), isBlank: true, title: 'Atención en el Aeropuerto' },
          { url: '/contacto', isBlank: false, title: 'Contáctanos' },
        ],
      },
    ];
  }

  ngOnInit(): void {
    this.shared.minFooter.subscribe(booking => {
      this.minFooter = booking;
      this.updateFooterHeight();
    });
    this.shared.headerDashboard.subscribe(isDash => {this.dashboard = isDash});
  }

  openContactWhatsApp(): void {
    this.wa.redirectToMessage('contactoDirecto');
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

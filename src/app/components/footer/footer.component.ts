import { Component, OnInit } from '@angular/core';
import { SanityFooterMenuComponent } from '../shared/sanity-footer-menu/sanity-footer-menu.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAndroid } from '@fortawesome/free-brands-svg-icons'
import { SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';

// Interface para un enlace individual
export interface FooterLink {
  url: string;      // Dirección del enlace
  isBlank: boolean; // Indica si se abre en una nueva pestaña
  title: string;    // Título del enlace
}

// Interface para una columna
export interface FooterColumn {
  title: string;        // Título de la columna
  links: FooterLink[];  // Array de enlaces dentro de la columna
}


export const footerColumns = [
  // Columna 1: Sobre Nosotros
  {
    title: 'Sobre Nosotros',
    links: [
      { url: '/quienes-somos', isBlank: false, title: 'Quiénes Somos' },
      { url: '/mision-y-vision', isBlank: false, title: 'Misión y Visión' },
      { url: '/sustentabilidad', isBlank: false, title: 'Sustentabilidad' },
      { url: '/politica-de-privacidad', isBlank: false, title: 'Política de Privacidad' },
      { url: '/terminos-y-condiciones', isBlank: false, title: 'Términos y Condiciones' },
      { url: '/trabaja-con-nosotros', isBlank: false, title: 'Trabaja con Nosotros' },
    ],
  },
  // Columna 2: Servicios
  {
    title: 'Servicios',
    links: [
      { url: '/reservacion-de-vuelos', isBlank: false, title: 'Reservación de Vuelos' },
      { url: '/hoteles-y-hospedaje', isBlank: false, title: 'Hoteles y Hospedaje' },
      { url: '/tours-y-experiencias', isBlank: false, title: 'Tours y Experiencias' },
      { url: '/paquetes-de-viaje', isBlank: false, title: 'Paquetes de Viaje' },
      { url: '/traslados-y-transportacion', isBlank: false, title: 'Traslados y Transportación' },
      { url: '/servicio-de-concierge', isBlank: false, title: 'Servicio de Concierge' },
    ],
  },
  // Columna 3: Ayuda y Contacto
  {
    title: 'Ayuda y Contacto',
    links: [
      { url: '/preguntas-frecuentes', isBlank: false, title: 'Preguntas Frecuentes (FAQ)' },
      { url: '/atencion-a-clientes', isBlank: false, title: 'Atención a Clientes' },
      { url: '/confirmar-servicios', isBlank: false, title: 'Confirmar Servicios' },
      { url: '/atencion-en-el-aeropuerto', isBlank: false, title: 'Atención en el Aeropuerto' },
      { url: '/contactanos', isBlank: false, title: 'Contáctanos' },
    ],
  },
];


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SanityFooterMenuComponent, FontAwesomeModule, CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  bookingMode:boolean=false;
  androidIcon=faAndroid;
  year:number=new Date().getFullYear();
  columns:FooterColumn[]=footerColumns;
  constructor(private shared: SharedDataService){}
  ngOnInit(): void {
    this.shared.headerBooking.subscribe(booking=>{
      this.bookingMode=booking;
    })
  }
}

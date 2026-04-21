import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { TermsTextComponent } from './terms-text/terms-text.component';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { SiteIdentityService } from '../../services/site-identity.service';

@Component({
  selector: 'app-terms',
  imports: [TermsTextComponent],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss'
})
export class TermsComponent implements OnInit {
  sections: {title: string, id:string}[] = [
    { title: "Introducción y Resumen General", id: "introduccion-resumen" },
    { title: "Definiciones e Interpretación", id: "definiciones" },
    { title: "1. Rol y Responsabilidades de la Agencia", id: "rol-agencia" },
    { title: "2. Responsabilidades de los Proveedores de Servicios", id: "responsabilidades-proveedores" },
    { title: "3. Pago y Transacciones Financieras", id: "pago-transacciones" },
    { title: "4. Obligaciones y Conducta del Cliente", id: "obligaciones-cliente" },
    { title: "5. Derechos de Propiedad Intelectual", id: "propiedad-intelectual" },
    { title: "6. Privacidad y Protección de Datos", id: "privacidad-datos" },
    { title: "7. Resolución de Disputas y Ley Aplicable", id: "resolucion-disputas" },
    { title: "8. Disposiciones Diversas", id: "disposiciones-diversas" },
    { title: "9. Beneficios Adicionales de Reservación", id: "beneficios-adicionales" },
    { title: "Contacto", id: "contacto" }
  ];
  active?:string;
  readonly site = this.siteIdentity.config;

  constructor(
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    private siteIdentity: SiteIdentityService
  ){
    this.meta.setMeta({
      title: `${this.site.brand.name} || Términos y Condiciones`,
      description: `Consulta los términos y condiciones de ${this.site.brand.name} para conocer derechos, responsabilidades y políticas aplicables a tus reservaciones.`,
      image: '/assets/img/banner-generico.jpg'
    });
  }
  ngOnInit(): void {
    this.shared.changeHeaderType("dark");
    this.shared.setMinimizedFooter(true);
  }
}

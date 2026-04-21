import { Component, OnInit } from '@angular/core';
import { SharedDataService } from '../../services/shared-data.service';
import { PrivacyTextComponent } from './privacy-text/privacy-text.component';
import { MetaHandlerService } from '../../services/meta-handler.service';
import { SiteIdentityService } from '../../services/site-identity.service';

@Component({
  selector: 'app-privacy',
  imports: [PrivacyTextComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent implements OnInit {
  sections: {title: string, id:string}[] = [
    { "title": "Introducción y Resumen General", "id": "introduccion-general" },
    { "title": "Definiciones e Interpretación", "id": "definiciones" },
    { "title": "1. Datos Personales Recabados", "id": "datos-recabados" },
    { "title": "2. Finalidades del Tratamiento de Datos Personales", "id": "finalidades-tratamiento" },
    { "title": "3. Transferencias de Datos Personales", "id": "transferencias-datos" },
    { "title": "4. Medidas de Seguridad", "id": "medidas-seguridad" },
    { "title": "5. Derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO)", "id": "derechos-arco" },
    { "title": "6. Uso de Cookies y Tecnologías de Seguimiento", "id": "cookies-tecnologias" },
    { "title": "7. Modificaciones al Aviso de Privacidad", "id": "modificaciones-aviso" },
    { "title": "8. Contacto", "id": "contacto" }
  ];
  active?:string;
  readonly site = this.siteIdentity.config;

  constructor(
    private shared: SharedDataService,
    private meta: MetaHandlerService,
    private siteIdentity: SiteIdentityService
  ){}
  ngOnInit(): void {
    this.meta.setMeta({
      title: `${this.site.brand.name} || Política de Privacidad`,
      description: `Conoce cómo ${this.site.brand.name} protege tus datos personales, el uso de cookies y tus derechos ARCO.`,
      image: '/assets/img/banner-generico.jpg'
    });
    this.shared.setMinimizedFooter(true);
    this.shared.changeHeaderType("dark");
  }
}

import { Component, OnInit } from '@angular/core';
import { MetaHandlerService } from '../../../../../services/meta-handler.service';

@Component({
  selector: 'app-contact-settings',
  imports: [],
  templateUrl: './contact-settings.component.html',
  styleUrl: './contact-settings.component.scss'
})
export class ContactSettingsComponent implements OnInit {
  constructor(private meta: MetaHandlerService) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Ajustes de Contacto',
      description: 'Actualiza tu información de contacto para recibir notificaciones y confirmaciones de viaje.',
      image: '/assets/img/banner-generico.jpg'
    });
  }
}

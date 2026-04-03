import { Component, OnInit } from '@angular/core';
import { MetaHandlerService } from '../../../../../services/meta-handler.service';

@Component({
  selector: 'app-saved-passengers-settings',
  imports: [],
  templateUrl: './saved-passengers-settings.component.html',
  styleUrl: './saved-passengers-settings.component.scss'
})
export class SavedPassengersSettingsComponent implements OnInit {
  constructor(private meta: MetaHandlerService) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Ajustes de Pasajeros',
      description: 'Guarda y administra pasajeros frecuentes para agilizar tus reservaciones en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
  }
}

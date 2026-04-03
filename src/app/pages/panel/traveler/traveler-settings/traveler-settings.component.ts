import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedDataService } from '../../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { TravelerFooterComponent } from '../traveler-footer/traveler-footer.component';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

@Component({
  selector: 'app-traveler-settings',
  imports: [RouterModule, CommonModule, TravelerFooterComponent],
  templateUrl: './traveler-settings.component.html',
  styleUrl: './traveler-settings.component.scss'
})
export class TravelerSettingsComponent implements OnInit {
  headerHeight: number = 0;
  constructor(private shared: SharedDataService, private meta: MetaHandlerService){
    this.shared.headerHeight.subscribe(height => {
      this.headerHeight = height;
    });
  }

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta || Ajustes',
      description: 'Administra la información y preferencias de tu cuenta en Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
  }
}

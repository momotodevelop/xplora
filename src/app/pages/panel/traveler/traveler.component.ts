import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { TravelerSidebarComponent } from './traveler-sidebar/traveler-sidebar.component';
import { MetaHandlerService } from '../../../services/meta-handler.service';

@Component({
    selector: 'app-traveler',
    imports: [RouterOutlet, CommonModule, TravelerSidebarComponent],
    templateUrl: './traveler.component.html',
    styleUrl: './traveler.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class TravelerComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    public sharedService: SharedDataService,
    private meta: MetaHandlerService
  ){}
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Mi Cuenta',
      description: 'Accede a tu panel de usuario para gestionar tus reservaciones, pagos y preferencias de viaje.',
      image: '/assets/img/banner-generico.jpg'
    });
    this.route.data.pipe(map(data => data["headerType"])).subscribe((type: "light"|"dark") => {
      this.sharedService.changeHeaderType(type);
    });
    this.route.data.pipe(map(data => data["dashboard"])).subscribe((type: boolean) => {
      this.sharedService.changeHeaderDashboard(type);
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar/admin-sidebar.component';
import { map } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { MetaHandlerService } from '../../../services/meta-handler.service';

@Component({
  selector: 'app-admin',
  imports: [RouterOutlet, CommonModule, AdminSidebarComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  constructor(
    private route: ActivatedRoute,
    public sharedService: SharedDataService,
    private meta: MetaHandlerService
  ){}
  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin',
      description: 'Panel administrativo de Xplora Travel para gestionar reservaciones, promociones y operaciones.',
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

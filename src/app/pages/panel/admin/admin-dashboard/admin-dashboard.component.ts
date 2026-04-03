import { Component, OnInit } from '@angular/core';
import { MetaHandlerService } from '../../../../services/meta-handler.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  constructor(private meta: MetaHandlerService) {}

  ngOnInit(): void {
    this.meta.setMeta({
      title: 'Xplora Travel || Admin || Dashboard',
      description: 'Resumen general del panel administrativo de Xplora Travel.',
      image: '/assets/img/banner-generico.jpg'
    });
  }
}

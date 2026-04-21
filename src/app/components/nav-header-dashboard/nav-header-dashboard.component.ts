import { Component } from '@angular/core';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';
import { SiteIdentityService } from '../../services/site-identity.service';

@Component({
    selector: 'app-nav-header-dashboard',
    imports: [ScrollRevealDirective],
    templateUrl: './nav-header-dashboard.component.html',
    styleUrl: './nav-header-dashboard.component.scss'
})
export class NavHeaderDashboardComponent {
  readonly site = this.siteIdentity.config;

  constructor(private siteIdentity: SiteIdentityService) {}
}

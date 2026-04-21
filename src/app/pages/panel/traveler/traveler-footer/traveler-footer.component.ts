import { Component } from '@angular/core';
import { SiteIdentityService } from '../../../../services/site-identity.service';

@Component({
  selector: 'app-traveler-footer',
  imports: [],
  templateUrl: './traveler-footer.component.html',
  styleUrl: './traveler-footer.component.scss'
})
export class TravelerFooterComponent {
  readonly site = this.siteIdentity.config;

  constructor(private siteIdentity: SiteIdentityService) {}
}

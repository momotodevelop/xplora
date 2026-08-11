import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DEFERRED_PAYMENT_TERMS_VERSION } from '../../../services/deferred-payment-plan.service';
import { SiteIdentityService } from '../../../services/site-identity.service';

@Component({
  selector: 'app-deferred-payment-terms-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './deferred-payment-terms-dialog.component.html',
  styleUrl: './deferred-payment-terms-dialog.component.scss'
})
export class DeferredPaymentTermsDialogComponent {
  readonly site = this.siteIdentity.config;
  readonly version = DEFERRED_PAYMENT_TERMS_VERSION;

  constructor(private siteIdentity: SiteIdentityService) {}
}

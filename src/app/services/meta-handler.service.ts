import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class MetaHandlerService {
  private isBrowser: boolean;

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  setMeta(options: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    ogType?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    payment?: {
      description?: string;
      currency?: string;
      amount?: number;
      expiresAt?: string; // ISO datetime
      status?: 'PENDIENTE' | 'PAGADO' | 'FALLIDO' | 'VENCIDO';
      id?: string;
      successUrl?: string;
    };
  }) {
    if (!this.isBrowser) {
      return; // No hacer nada en SSR
    }

    if (options.title) {
      this.titleService.setTitle(options.title);
      this.updateOrCreateTag('og:title', options.title, 'property');
      this.updateOrCreateTag('twitter:title', options.title, 'name');
    }

    if (options.description) {
      this.updateOrCreateTag('description', options.description, 'name');
      this.updateOrCreateTag('og:description', options.description, 'property');
      this.updateOrCreateTag('twitter:description', options.description, 'name');
    }

    if (options.image) {
      this.updateOrCreateTag('og:image', options.image, 'property');
      this.updateOrCreateTag('twitter:image', options.image, 'name');
    }

    this.updateOrCreateTag(
      'og:url',
      options.url || window.location.href,
      'property'
    );

    this.updateOrCreateTag(
      'og:type',
      options.ogType || 'website',
      'property'
    );

    this.updateOrCreateTag(
      'twitter:card',
      options.twitterCard || 'summary_large_image',
      'name'
    );

    if (options.payment) {
      this.updateOrCreateTag('og:type', 'payment.link', 'property');
      if (options.payment.description) {
        this.updateOrCreateTag('payment:description', options.payment.description, 'property');
      }
      if (options.payment.currency) {
        this.updateOrCreateTag('payment:currency', options.payment.currency, 'property');
      }
      if (options.payment.amount != null) {
        this.updateOrCreateTag('payment:amount', options.payment.amount.toString(), 'property');
      }
      if (options.payment.expiresAt) {
        this.updateOrCreateTag('payment:expires_at', options.payment.expiresAt, 'property');
      }
      if (options.payment.status) {
        this.updateOrCreateTag('payment:status', options.payment.status, 'property');
      }
      if (options.payment.id) {
        this.updateOrCreateTag('payment:id', options.payment.id, 'property');
      }
      if (options.payment.successUrl) {
        this.updateOrCreateTag('payment:success_url', options.payment.successUrl, 'property');
      }
    }
  }

  private updateOrCreateTag(nameOrProp: string, content: string, attr: 'name' | 'property') {
    this.metaService.updateTag({ [attr]: nameOrProp, content });
  }
}

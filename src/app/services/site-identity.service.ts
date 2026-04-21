import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { SITE_IDENTITY_CONFIG, SiteIdentityConfig, SitePhone } from '../config/site-identity.config';

export interface SitePhoneLink extends SitePhone {
  href: string;
  formatted: string;
}

@Injectable({
  providedIn: 'root'
})
export class SiteIdentityService {
  readonly config: SiteIdentityConfig = SITE_IDENTITY_CONFIG;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  applyTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.documentElement.style.setProperty(
      '--site-primary-color',
      this.config.brand.primaryColor
    );
    this.document.documentElement.style.setProperty(
      '--color-blue-1',
      this.config.brand.primaryColor
    );
  }

  getContactPhones(): SitePhoneLink[] {
    return this.config.contact.phones.map((phone) => this.toPhoneLink(phone));
  }

  getWhatsAppContact(): SitePhoneLink {
    return this.toPhoneLink(this.config.contact.whatsapp);
  }

  getEmailHref(): string {
    return `mailto:${this.config.contact.email}`;
  }

  getEmailAddress(): string {
    return this.config.contact.email;
  }

  getWebsiteHref(): string {
    return this.config.brand.websiteUrl;
  }

  getWebsiteDomain(): string {
    return this.config.brand.websiteDomain;
  }

  getWhatsAppNumber(): string {
    return this.toInternationalPhoneNumber(this.config.contact.whatsapp);
  }

  getUiAvatarBackgroundColor(): string {
    return this.config.brand.primaryColor.replace('#', '');
  }

  toPhoneLink(phone: SitePhone): SitePhoneLink {
    return {
      ...phone,
      href: this.getTelHref(phone),
      formatted: this.formatPhone(phone)
    };
  }

  getTelHref(phone: SitePhone): string {
    return `tel:+${this.toInternationalPhoneNumber(phone)}`;
  }

  toInternationalPhoneNumber(phone: SitePhone): string {
    return `${this.normalizeDigits(phone.countryCode)}${this.normalizeDigits(phone.lada)}${this.normalizeDigits(phone.phone)}`;
  }

  formatPhone(phone: SitePhone): string {
    const countryCode = this.normalizeDigits(phone.countryCode);
    const lada = this.normalizeDigits(phone.lada);
    const localNumber = this.normalizeDigits(phone.phone);
    const formattedLocalNumber = this.formatLocalNumber(localNumber);
    const shouldOmitCountryCode = countryCode === '52' && lada === '800';
    const prefix = shouldOmitCountryCode ? '' : `+${countryCode} `;

    return `${prefix}(${lada}) ${formattedLocalNumber}`.trim();
  }

  private normalizeDigits(value: string): string {
    return String(value ?? '').replace(/\D+/g, '');
  }

  private formatLocalNumber(value: string): string {
    if (value.length === 7) {
      return `${value.slice(0, 3)} ${value.slice(3)}`;
    }

    if (value.length === 8) {
      return `${value.slice(0, 4)} ${value.slice(4)}`;
    }

    if (value.length === 10) {
      return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    }

    return value;
  }
}

import { Component, ElementRef, Inject, Input, OnChanges, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SiteIdentityService } from '../../../services/site-identity.service';

@Component({
  selector: 'app-privacy-text',
  imports: [],
  templateUrl: './privacy-text.component.html',
  styleUrl: './privacy-text.component.scss'
})
export class PrivacyTextComponent implements OnChanges {
  @Input() activeSection:string = '';
  private readonly isBrowser: boolean;
  readonly site = this.siteIdentity.config;
  readonly emailHref = this.siteIdentity.getEmailHref();
  readonly websiteHref = this.siteIdentity.getWebsiteHref();
  readonly primaryPhone = this.siteIdentity.getContactPhones()[0];

  constructor(
    private el: ElementRef<HTMLElement>,
    private siteIdentity: SiteIdentityService,
    @Inject(PLATFORM_ID) platformId: Object
  ){
    this.isBrowser = isPlatformBrowser(platformId);
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes){
      //console.log(changes);
      if(changes['activeSection']){
        const change = changes['activeSection'];
        if(change.currentValue!==change.previousValue){
          this.scrollToElemento(change.currentValue);
        }
      }
    }
  }
  scrollToElemento(id:string) {
    if (!this.isBrowser || !id) {
      return;
    }

    const root = this.el.nativeElement;
    const elemento = root.ownerDocument?.getElementById(id);
    if (elemento && root.contains(elemento)) {
      elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}

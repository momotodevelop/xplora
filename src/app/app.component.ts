import { Component, Inject, Injector, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavHeaderComponent } from './components/nav-header/nav-header.component';
import {} from '@angular/common/http';
import { SharedDataService } from './services/shared-data.service';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe, isPlatformBrowser } from '@angular/common';
import { DateStringPipe } from './date-string.pipe';
import { DurationPipe } from './duration.pipe';
import { GoogleTagManagerService } from 'angular-google-tag-manager';
import { LinkedInConversionsService } from './services/linkedin-conversions.service';
import { SiteIdentityService } from './services/site-identity.service';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        FooterComponent,
        NavHeaderComponent,
        CommonModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: [AsyncPipe, DatePipe, TitleCasePipe, DateStringPipe, DurationPipe]
})
export class AppComponent implements OnInit {
  title: string;
  hideNav:boolean = false;
  private readonly isBrowser: boolean;

  constructor(
    public shared: SharedDataService,
    @Inject(PLATFORM_ID) platformId: Object,
    private injector: Injector,
    private linkedInConversions: LinkedInConversionsService,
    public siteIdentity: SiteIdentityService
  ){
    this.isBrowser = isPlatformBrowser(platformId);
    this.title = this.siteIdentity.config.brand.name;
    this.shared.hideNav.subscribe(hidden=>{
      this.hideNav = hidden;
    });
  }
  ngOnInit(): void {
    this.siteIdentity.applyTheme();

    if (this.isBrowser) {
      this.linkedInConversions.initialize();
      this.injector.get(GoogleTagManagerService).addGtmToDom();
    }
  }
}

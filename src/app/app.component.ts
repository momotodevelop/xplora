import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavHeaderComponent } from './components/nav-header/nav-header.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import {} from '@angular/common/http';
import { SharedDataService } from './services/shared-data.service';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe, isPlatformBrowser } from '@angular/common';
import { DateStringPipe } from './date-string.pipe';
import { DurationPipe } from './duration.pipe';
import { GoogleTagManagerService } from 'angular-google-tag-manager';

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        FooterComponent,
        NavHeaderComponent,
        MatBottomSheetModule,
        MatButtonModule,
        CommonModule
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: [AsyncPipe, DatePipe, TitleCasePipe, DateStringPipe, DurationPipe]
})
export class AppComponent implements OnInit {
  title = 'Xplora Travel';
  hideNav:boolean = false;
  private readonly isBrowser: boolean;

  constructor(
    public shared: SharedDataService,
    @Inject(PLATFORM_ID) platformId: Object,
    private gtmService: GoogleTagManagerService
  ){
    this.isBrowser = isPlatformBrowser(platformId);
    this.shared.hideNav.subscribe(hidden=>{
      this.hideNav = hidden;
    });
  }
  ngOnInit(): void {
    if (this.isBrowser) {
      this.gtmService.addGtmToDom();
    }
  }
}

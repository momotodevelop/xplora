import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavigationEnd, RouterOutlet, Router } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavHeaderComponent } from './components/nav-header/nav-header.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import {} from '@angular/common/http';
import { SharedDataService } from './services/shared-data.service';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { DateStringPipe } from './date-string.pipe';
import { DurationPipe } from './duration.pipe';

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
  navHeight:number = 0;
  constructor(public shared: SharedDataService, private cdr: ChangeDetectorRef, private router: Router){
    this.shared.headerHeight.subscribe(height=>{
      this.navHeight = height;
      this.cdr.detectChanges();
    });
    this.shared.hideNav.subscribe(hidden=>{
      this.hideNav = hidden;
      this.cdr.detectChanges();
    });
  }
  ngOnInit(): void {
    this.cdr.detectChanges();
  }
}

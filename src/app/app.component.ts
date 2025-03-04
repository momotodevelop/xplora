import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavHeaderComponent } from './components/nav-header/nav-header.component';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import {} from '@angular/common/http';
import { SharedDataService } from './services/shared-data.service';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { DateStringPipe } from './date-string.pipe';
import { DurationPipe } from './duration.pipe';
import { AngularFireModule } from '@angular/fire/compat';
import { firebaseConfig } from '../environments/environment'
import { ToggleClassDirective } from './toggle-class.directive';
import {
  FingerprintjsProAngularModule
} from '@fingerprintjs/fingerprintjs-pro-angular'

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        FooterComponent,
        NavHeaderComponent,
        MatBottomSheetModule,
        MatButtonModule,
        CommonModule,
        DatePipe,
        TitleCasePipe,
        ToggleClassDirective,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: [AsyncPipe, DatePipe, TitleCasePipe, DateStringPipe, DurationPipe]
})
export class AppComponent implements OnInit {
  title = 'xplora';
  hideNav:boolean = false
  constructor(public shared: SharedDataService, private cdr: ChangeDetectorRef){
    this.shared.headerHeight.subscribe(height=>{
      console.log(height);
    });
    this.shared.hideNav.subscribe(hidden=>{
      this.hideNav = hidden;
    });
  }
  ngOnInit(): void {
    this.cdr.detectChanges();
  }
  
}

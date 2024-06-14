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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    FooterComponent, 
    NavHeaderComponent, 
    MatBottomSheetModule, 
    MatButtonModule,
    
// TODO: `HttpClientModule` should not be imported into a component directly.
// Please refactor the code to add `provideHttpClient()` call to the provider list in the
// application bootstrap logic and remove the `HttpClientModule` import from this component.
HttpClientModule,
    CommonModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [AsyncPipe, DatePipe, TitleCasePipe, DateStringPipe, DurationPipe]
})
export class AppComponent implements OnInit {
  title = 'xplora';
  constructor(public shared: SharedDataService, private cdr: ChangeDetectorRef){
    this.shared.headerHeight.subscribe(height=>{
      console.log(height);
    });
    this.shared.headerType.subscribe(htype=>{
      
    })
  }
  ngOnInit(): void {
    this.cdr.detectChanges();
  }
  
}

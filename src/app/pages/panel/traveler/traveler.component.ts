import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { SharedDataService } from '../../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { TravelerSidebarComponent } from './traveler-sidebar/traveler-sidebar.component';

@Component({
    selector: 'app-traveler',
    imports: [RouterOutlet, CommonModule, TravelerSidebarComponent],
    templateUrl: './traveler.component.html',
    styleUrl: './traveler.component.scss'
})
export class TravelerComponent implements OnInit {
  constructor(private route: ActivatedRoute, public sharedService: SharedDataService){}
  ngOnInit(): void {
    this.route.data.pipe(map(data => data["headerType"])).subscribe((type: "light"|"dark") => {
      this.sharedService.changeHeaderType(type);
    });
    this.route.data.pipe(map(data => data["dashboard"])).subscribe((type: boolean) => {
      this.sharedService.changeHeaderDashboard(type);
    });
  }
}

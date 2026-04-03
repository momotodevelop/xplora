import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-traveler-sidebar',
    imports: [CommonModule, RouterModule],
    templateUrl: './traveler-sidebar.component.html',
    styleUrl: './traveler-sidebar.component.scss'
})
export class TravelerSidebarComponent {
  @Input() active:"home"|"bookings"|"settings"="home";

}

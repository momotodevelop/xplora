import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-traveler-sidebar',
    imports: [CommonModule],
    templateUrl: './traveler-sidebar.component.html',
    styleUrl: './traveler-sidebar.component.scss'
})
export class TravelerSidebarComponent {
  @Input() active:"home"|"bookings"|"settings"="home";

}

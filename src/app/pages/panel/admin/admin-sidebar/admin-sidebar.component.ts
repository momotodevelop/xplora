import { Component, Input } from '@angular/core';
import { FireAuthService } from '../../../../services/fire-auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  imports: [CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  @Input() active:"dashboard"|"lite-vouchers"|"bookings"="dashboard";
  constructor(private auth: FireAuthService){}
  logout(){
    this.auth.logout();
  }  
}

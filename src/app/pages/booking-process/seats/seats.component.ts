import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-seats',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './seats.component.html',
  styleUrl: './seats.component.scss'
})
export class SeatsComponent {

}

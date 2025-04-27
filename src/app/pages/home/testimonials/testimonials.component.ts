import { Component } from '@angular/core';
import { OPINIONS } from '../../about/about.component';

@Component({
  selector: 'app-testimonials',
  standalone: false,
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss'
})
export class TestimonialsComponent {
  opinions = OPINIONS.slice(0, 5);
  rating = (OPINIONS.reduce((acc, opinion) => acc + opinion.rating, 0) / OPINIONS.length).toFixed(1);
}

import { Component } from '@angular/core';
import { OPINIONS } from '../../about/about.component';
import { ScrollRevealDirective } from '../../../scroll-reveal.directive';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
  imports: [ScrollRevealDirective]
})
export class TestimonialsComponent {
  opinions = OPINIONS.slice(0, 5);
  rating = (OPINIONS.reduce((acc, opinion) => acc + opinion.rating, 0) / OPINIONS.length).toFixed(1);
}

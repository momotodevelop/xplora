import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SearchComponent } from './search/search.component';
import { BookingBenefitsComponent } from './booking-benefits/booking-benefits.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { InspirationComponent } from './inspiration/inspiration.component';
import { NewsletterSubscriptionComponent } from './newsletter-subscription/newsletter-subscription.component';
import { MetaHandlerService } from '../../services/meta-handler.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  imports: [
    SearchComponent,
    BookingBenefitsComponent,
    TestimonialsComponent,
    InspirationComponent,
    NewsletterSubscriptionComponent,

  ]
})
export class HomeComponent {
  constructor(private meta: MetaHandlerService){
    this.meta.setMeta({
      title: "Xplora Travel || Bienvenido",
      description: 'Descubre y reserva experiencias de viaje únicas con Xplora. Encuentra inspiración, beneficios exclusivos y opiniones de viajeros para planificar tu próxima aventura.',
      image: 'https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/miniatures%2Fus.jpg?alt=media&token=33849ca2-1a2a-48a1-a6ce-e017b6d0620a'
    });
  }

}

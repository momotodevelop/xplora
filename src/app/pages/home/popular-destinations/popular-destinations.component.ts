import { Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BottomsheetDestinationSearchComponent } from '../../../shared/bottomsheet-destination-search/bottomsheet-destination-search.component';
import { ScrollRevealDirective } from '../../../scroll-reveal.directive';

export interface Destination{
  name: string;
  description: string;
  route: string;
  image: string;
}

@Component({
  selector: 'app-popular-destinations',
  standalone: true,
  templateUrl: './popular-destinations.component.html',
  styleUrl: './popular-destinations.component.scss',
  imports: [
    ScrollRevealDirective
  ]
})
export class PopularDestinationsComponent {
  featuredDestinations: Destination[] = [
    {
      name: "Cancún",
      description: "Cancún, famosa por sus playas de arena blanca y aguas cristalinas, es un destino ideal para el buceo y el snorkel. Ofrece una vibrante vida nocturna y una rica herencia cultural maya.",
      route: "cancun",
      image: "/assets/img/featured-destinations/cancun.jpg"
    },
    {
      name: "Oaxaca",
      description: "Oaxaca, conocida por su rica tradición cultural y gastronómica, es hogar de impresionantes sitios arqueológicos y festivales coloridos como la Guelaguetza.",
      route: "oaxaca",
      image: "/assets/img/featured-destinations/oaxaca.jpg"
    },
    {
      name: "Monterrey",
      description: "Monterrey, una ciudad moderna rodeada de montañas, es famosa por su industria, parques naturales como el Parque Fundidora y su vibrante escena cultural.",
      route: "monterrey",
      image: "/assets/img/featured-destinations/monterrey.jpg"
    },
    {
      name: "Tulum",
      description: "Tulum, conocida por sus ruinas mayas frente al mar y sus playas paradisíacas, es un destino perfecto para los amantes de la historia y la naturaleza.",
      route: "tulum",
      image: "/assets/img/featured-destinations/tulum.jpg"
    },
    {
      name: "Puerto Vallarta",
      description: "Puerto Vallarta, con su encantador malecón y playas doradas, ofrece una mezcla de actividades acuáticas, arte y una vibrante vida nocturna.",
      route: "puerto-vallarta",
      image: "/assets/img/featured-destinations/vallarta.jpg"
    },
    {
      name: "Huatulco",
      description: "Huatulco, famosa por sus nueve bahías y 36 playas, es un destino ideal para el ecoturismo y actividades acuáticas como el buceo y el snorkel.",
      route: "huatulco",
      image: "/assets/img/featured-destinations/huatulco.jpg"
    },
    {
      name: "Paris",
      description: "Paris, la ciudad del amor, es conocida por sus icónicos monumentos como la Torre Eiffel, su rica historia, museos de renombre mundial y su exquisita gastronomía.",
      route: "paris",
      image: "/assets/img/featured-destinations/paris.jpg"
    },
    {
      name: "New York",
      description: "New York, la ciudad que nunca duerme, es famosa por sus rascacielos, Broadway, Central Park y su diversidad cultural y gastronómica.",
      route: "new-york",
      image: "/assets/img/featured-destinations/newyork.jpg"
    },
    {
      name: "Tokyo",
      description: "Tokyo, una metrópolis futurista, es conocida por su tecnología avanzada, cultura pop, templos históricos y su deliciosa y variada gastronomía.",
      route: "tokyo",
      image: "/assets/img/featured-destinations/tokio.jpg"
    },
    {
      name: "Sydney",
      description: "Sydney, famosa por su icónica Ópera y el Puente de la Bahía, ofrece hermosas playas, parques nacionales y una vibrante escena cultural.",
      route: "sydney",
      image: "/assets/img/featured-destinations/sydney.jpg"
    }
  ]
  constructor(private bs: MatBottomSheet){

  }
  openDestination(destination: string) {
    //console.log(destination);
    this.bs.open(BottomsheetDestinationSearchComponent, {
      data: destination,
      panelClass: 'custom-bottom-sheet'
    });
  }
}

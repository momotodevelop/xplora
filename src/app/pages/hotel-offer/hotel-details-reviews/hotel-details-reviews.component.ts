import { Component, Input, OnInit } from '@angular/core';
import { HotelReviewComponent } from './hotel-review/hotel-review.component';
import { Sentiments } from '../../../types/amadeus-hotel-rating.types';
import { AmadeusHotelsService } from '../../../services/amadeus-hotels.service';
import { CommonModule } from '@angular/common';
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HotelHandlerService } from '../../../services/hotel-handler.service';

export interface HotelRatingCategoryAverage{
  rating: number,
  title: string,
  percentage: number
}

@Component({
  selector: 'app-hotel-details-reviews',
  imports: [HotelReviewComponent, CommonModule, FontAwesomeModule],
  templateUrl: './hotel-details-reviews.component.html',
  styleUrl: './hotel-details-reviews.component.scss'
})
export class HotelDetailsReviewsComponent implements OnInit {
  @Input() sentiments?:Sentiments;
  @Input() reviews!: google.maps.places.Review[] | undefined;
  @Input() reviewsCount!: number | null | undefined;
  @Input() rating!: number | null | undefined;
  testDate:Date = new Date()
  displaySentiments: HotelRatingCategoryAverage[] = [];
  starIcon=faStar;
  constructor(private hotels: AmadeusHotelsService, public hotelHandler:HotelHandlerService){}
  ngOnInit(): void {
    this.reviews = this.reviews?.slice(0,4);
    this.hotels.getRating("DKLONDSF").subscribe(rating=>{
      console.log(rating);
      if(rating.data!==undefined){
        if(rating.data.length>0){
          this.sentiments = rating.data[0].sentiments;
          if (this.sentiments) {
            const sentimentsList = [
              { rating: this.sentiments.internet, title: "Conexión WiFi" },
              { rating: this.sentiments.sleepQuality, title: "Calidad del sueño" },
              { rating: this.sentiments.service, title: "Servicio" },
              { rating: this.sentiments.facilities, title: "Instalaciones" },
              { rating: this.sentiments.roomComforts, title: "Confort de la habitación" },
              { rating: this.sentiments.valueForMoney, title: "Relación calidad/precio" },
              { rating: this.sentiments.location, title: "Ubicación" },
              { rating: this.sentiments.pointsOfInterest, title: "Puntos de interés" },
              { rating: this.sentiments.staff, title: "Personal" }
            ];
        
            // Iteramos sobre la lista y añadimos solo las propiedades definidas
            sentimentsList.forEach(sentiment => {
              if (sentiment.rating !== undefined && sentiment.rating !== null) {
                this.displaySentiments.push({
                  rating: Number((sentiment.rating/10/2).toFixed(1)),
                  title: sentiment.title,
                  percentage: sentiment.rating
                });
              }
            });
            console.log(this.displaySentiments);
          }
        }
      }
    });
  }
}

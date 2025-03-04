import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-hotel-review',
  imports: [CommonModule],
  templateUrl: './hotel-review.component.html',
  styleUrl: './hotel-review.component.scss'
})
export class HotelReviewComponent implements OnInit {
  @Input() review!:google.maps.places.Review;
  ngOnInit(): void {
    console.log(this.review);
  }
}

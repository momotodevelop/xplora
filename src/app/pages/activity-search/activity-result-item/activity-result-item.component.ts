import { Component, Input, OnInit } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';
import { XploraTour } from '../../../types/xplora-tour.types';
import { SlickConfig } from '../../../types/slick.types';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-activity-result-item',
  imports: [SlickCarouselModule, CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './activity-result-item.component.html',
  styleUrl: './activity-result-item.component.scss'
})
export class ActivityResultItemComponent implements OnInit {
  @Input() activity!: XploraTour;
  @Input() includeTransfer: boolean = false;
  @Input() destination?: string;
  @Input() searchParams?: Record<string, string | number | boolean | undefined>;
  timeIcon = faClock;
  paxIcon = faUser;
  locationIcon = faMapMarkerAlt;
  sliderConfig: SlickConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    dots: false,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    accessibility: true
  };

  ngOnInit(): void {
  }
}

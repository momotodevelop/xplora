import { Component, Input, OnInit } from '@angular/core';
import { SanityService } from '../../../services/sanity.service';
import { NavigationData } from '../../../types/sanity.types';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'sanity-footer-menu',
    imports: [CommonModule],
    templateUrl: './sanity-footer-menu.component.html',
    styleUrl: './sanity-footer-menu.component.scss'
})
export class SanityFooterMenuComponent implements OnInit {
  @Input() slug!:string;
  @Input() isBooking:boolean=false;
  data?:NavigationData;
  constructor(private sanity: SanityService){}
  ngOnInit(): void {
    
  }
}

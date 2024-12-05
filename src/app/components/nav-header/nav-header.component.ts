import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { SanityService } from '../../services/sanity.service';
import { NavigationItem } from '../../types/sanity.types';
import { MenuItem } from '../../types/navigation.types';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-header.component.html',
  styleUrl: './nav-header.component.scss'
})
export class NavHeaderComponent implements OnInit, AfterViewInit {
  headerType:HeaderType="light";
  dashboard:boolean=false;
  booking:boolean=false;
  menuItems:MenuItem []=[
    {
      name: "Inicio",
      tipoEnlace: "interno",
      route: "inicio",
      openInNewTab: false
    },
    {
      name: "Nosotros",
      tipoEnlace: "interno",
      route: "nosotros",
      openInNewTab: false
    },
    {
      name: "Contacto",
      tipoEnlace: "interno",
      route: "contacto",
      openInNewTab: false
    }
  ];
  @ViewChild('header', {read: ElementRef, static:false}) headerElement!: ElementRef;
  constructor(public shared: SharedDataService, private sanity: SanityService){}
  ngOnInit(): void {
    this.shared.headerType.subscribe({next: (type:HeaderType)=>{this.headerType=type}});
    this.shared.headerDashboard.subscribe(isDash=>{this.dashboard=isDash});
    this.shared.headerBooking.subscribe(isBooking=>{this.booking=isBooking});
  }
  ngAfterViewInit(): void {
    this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
  }
}

import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { SanityService } from '../../services/sanity.service';
import { NavigationItem } from '../../types/sanity.types';

@Component({
  selector: 'app-nav-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nav-header.component.html',
  styleUrl: './nav-header.component.scss'
})
export class NavHeaderComponent implements OnInit, AfterViewInit {
  headerType:HeaderType="light";
  menuItems:NavigationItem[]=[];
  @ViewChild('header', {read: ElementRef, static:false}) headerElement!: ElementRef;
  constructor(public shared: SharedDataService, private sanity: SanityService){}
  ngOnInit(): void {
    this.shared.headerType.subscribe({next: (type:HeaderType)=>{this.headerType=type}});
    this.sanity.getBySlug("navigation", "menu-principal").then(data=>{
      console.log(data[0].navigationItems);
      this.menuItems=data[0].navigationItems;
    });
  }
  ngAfterViewInit(): void {
    this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
  }
}

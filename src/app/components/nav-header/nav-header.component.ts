import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { SanityService } from '../../services/sanity.service';
import { NavigationItem } from '../../types/sanity.types';
import { MenuItem } from '../../types/navigation.types';
import { FireAuthService } from '../../services/fire-auth.service';
import { User } from 'firebase/auth';

@Component({
    selector: 'app-nav-header',
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
    },
    {
      name: "Blog",
      tipoEnlace: "interno",
      route: "blog",
      openInNewTab: false
    },
    {
      name: "Ayuda",
      tipoEnlace: "interno",
      route: "blog",
      openInNewTab: false
    }
  ];
  @ViewChild('header', {read: ElementRef, static:false}) headerElement!: ElementRef;
  constructor(public shared: SharedDataService, private auth: FireAuthService){}
  user?:User;
  hide:boolean=false;
  ngOnInit(): void {
    this.shared.headerType.subscribe((type:HeaderType)=>{
      if(type!==undefined){
        this.headerType=type;
      }
    });
    this.shared.headerDashboard.subscribe(isDash=>{this.dashboard=isDash});
    this.shared.headerBooking.subscribe(isBooking=>{this.booking=isBooking});
    this.shared.hideNav.subscribe(isHidden=>{
      this.hide=isHidden;
    })
    this.auth.user.subscribe(user=>{
      if(user){
        this.user=user;
        console.log(user.displayName);
      }else{
        this.user=undefined;
      }
    });
  }
  ngAfterViewInit(): void {
    this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
  }
  logout(){
    this.auth.logout();
  }
}

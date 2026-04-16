import { AfterViewInit, Component, ElementRef, Inject, Injector, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SanityService } from '../../services/sanity.service';
import { NavigationItem } from '../../types/sanity.types';
import { MenuItem } from '../../types/navigation.types';
import { FireAuthService, UserData } from '../../services/fire-auth.service';
import { User } from 'firebase/auth';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { BookingProcessExitDialogComponent } from './booking-process-exit-dialog/booking-process-exit-dialog.component';
import { Router, RouterModule } from '@angular/router';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { BookingProcessLoginBottomsheetComponent } from './booking-process-login-bottomsheet/booking-process-login-bottomsheet.component';
import { ScrollRevealDirective } from '../../scroll-reveal.directive';

@Component({
    selector: 'app-nav-header',
    imports: [CommonModule, MatDialogModule, MatBottomSheetModule, ScrollRevealDirective],
    templateUrl: './nav-header.component.html',
    styleUrl: './nav-header.component.scss'
})
export class NavHeaderComponent implements OnInit, AfterViewInit {
  headerType:HeaderType="light";
  dashboard:boolean=false;
  booking:boolean=false;
  private readonly isBrowser: boolean;
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
      name: "Confianza",
      tipoEnlace: "interno",
      route: "confianza",
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
      route: "ayuda",
      openInNewTab: false
    }
  ];
  @ViewChild('header', {read: ElementRef, static:false}) headerElement!: ElementRef;
  constructor(
    public shared: SharedDataService,
    private router: Router,
    private injector: Injector,
    @Inject(PLATFORM_ID) platformId: Object
  ){
    this.isBrowser = isPlatformBrowser(platformId);
  }
  user?:User;
  hide:boolean=false;
  userData:UserData|null = null;
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
    });

    if (!this.isBrowser) {
      return;
    }

    const auth = this.injector.get(FireAuthService);
    auth.user.subscribe(user=>{
      if(user){
        this.user=user;
        console.log("User logged in:", user);
      }else{
        console.log("User logged out");
        this.user=undefined;
      }
    });
    auth.data.subscribe(data=>{
      this.userData = data;
    });
  }
  ngAfterViewInit(): void {
    if (this.isBrowser && this.headerElement?.nativeElement) {
      this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
    }
  }
  login(){
    if (!this.isBrowser) {
      return;
    }
    this.injector.get(MatBottomSheet).open(BookingProcessLoginBottomsheetComponent, {
      panelClass: 'custom-bottom-sheet'
    });
  }
  logout(){
    if (!this.isBrowser) {
      return;
    }
    this.injector.get(FireAuthService).logout();
  }
  exit(){
    if (!this.isBrowser) {
      return;
    }
    this.injector.get(MatDialog).open(BookingProcessExitDialogComponent, {
      disableClose: true,
      width: '350px'
    }).afterClosed().subscribe(result=>{
      if(result){
        this.shared.setBookingMode(false);
        this.router.navigate(['inicio']);
      }
    })
  }
  get profileAvatar():string{
    if(this.user?.photoURL){
      return this.user.photoURL;
    } else if(this.userData){
      if(this.userData.name && this.userData.lastName){
        return `https://ui-avatars.com/api/?background=004aad&color=fff&name=${this.userData.name}+${this.userData.lastName}&rounded=true&bold=true`;
      }else{
        if(this.user?.displayName){
          const name = this.user.displayName.replace(/\s+/g, '+') || '';
          return `https://ui-avatars.com/api/?background=004aad&color=fff&name=${name}+&rounded=true&bold=true`;
        }else{
          return `https://ui-avatars.com/api/?background=004aad&color=fff&name=Xplora+Travel&rounded=true&bold=true`;
        }
      }
    }else{
      return `https://ui-avatars.com/api/?background=004aad&color=fff&name=Xplora+Travel&rounded=true&bold=true`;
    }
  }
}

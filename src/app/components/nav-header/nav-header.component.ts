import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HeaderType, SharedDataService } from '../../services/shared-data.service';
import { CommonModule } from '@angular/common';
import { SanityService } from '../../services/sanity.service';
import { NavigationItem } from '../../types/sanity.types';
import { MenuItem } from '../../types/navigation.types';
import { FireAuthService } from '../../services/fire-auth.service';
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
  constructor(
    public shared: SharedDataService,
    private auth: FireAuthService,
    private dialog: MatDialog,
    private router: Router,
    private bottomSheet: MatBottomSheet
  ){}
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
      if(user?.displayName==null || user?.displayName==undefined){
        
      }
      if(user){
        this.user=user;
      }else{
        this.user=undefined;
      }
    });
  }
  ngAfterViewInit(): void {
    this.shared.changeHeaderHeight(this.headerElement.nativeElement.offsetHeight);
  }
  login(){
    this.bottomSheet.open(BookingProcessLoginBottomsheetComponent, {panelClass: 'custom-bottom-sheet'});
  }
  logout(){
    this.auth.logout();
  }
  exit(){
    this.dialog.open(BookingProcessExitDialogComponent, {
      disableClose: true,
      width: '350px'
    }).afterClosed().subscribe(result=>{
      if(result){
        this.shared.setBookingMode(false);
        this.router.navigate(['inicio']);
      }
    })
  }
}

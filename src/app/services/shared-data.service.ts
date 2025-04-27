import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
export type HeaderType = "light"|"dark"|"white";

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private _headerType = new BehaviorSubject<HeaderType>("light");
  headerType = this._headerType.asObservable();
  private _headerDashboard = new BehaviorSubject<boolean>(false);
  headerDashboard = this._headerDashboard.asObservable();
  private _headerBooking = new BehaviorSubject<boolean>(false);
  headerBooking = this._headerBooking.asObservable();
  private _headerHeight = new BehaviorSubject<number>(0);
  headerHeight = this._headerHeight.asObservable();
  private _loading = new BehaviorSubject<boolean>(false);
  loading = this._loading.asObservable();
  private _sidebarDashboardOpened = new BehaviorSubject<boolean>(true);
  sidebarDashboardOpened = this._sidebarDashboardOpened.asObservable();
  private _hideNav = new BehaviorSubject<boolean>(false);
  hideNav = this._hideNav.asObservable();
  constructor() { }
  changeHeaderType(headerType: HeaderType) {
    if(headerType){
      this._headerType.next(headerType);
    }
  }
  changeHeaderHeight(height:number){
    console.log(height);
    this._headerHeight.next(height);
  }
  toggleHideNav(hidden?:boolean){
    const isHidden = hidden ?? !this._hideNav.value;
    if(isHidden){
      this._headerHeight.next(0);
    }
    this._hideNav.next(isHidden);
  }
  setLoading(loading:boolean){
    if(!loading){
      setTimeout(() => {
        this._loading.next(false);
      }, 500);
    }else{
      this._loading.next(true);
    }
  }
  changeHeaderDashboard(isDashboard:boolean){
    this._headerDashboard.next(isDashboard);
  }
  settBookingMode(isBooking:boolean){
    if(isBooking){
      this._headerType.next("dark");
    }
    this._headerBooking.next(isBooking);
  }
  toggleDashboardSidebar(){
    this._sidebarDashboardOpened.next(!this._sidebarDashboardOpened.value);
  }
}

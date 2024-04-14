import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
export type HeaderType = "light"|"dark";

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private _headerType = new BehaviorSubject<HeaderType>("light");
  headerType = this._headerType.asObservable();
  private _headerHeight = new BehaviorSubject<number>(0);
  headerHeight = this._headerHeight.asObservable();
  private _loading = new BehaviorSubject<boolean>(false);
  loading = this._loading.asObservable();
  constructor() { }
  changeHeaderType(headerType: HeaderType) {
    this._headerType.next(headerType);
  }
  changeHeaderHeight(height:number){
    console.log(height);
    this._headerHeight.next(height);
  }
  setLoading(loading:boolean){
    this._loading.next(loading);
  }
}

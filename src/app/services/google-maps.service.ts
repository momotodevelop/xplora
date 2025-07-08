import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private apiKey: string = 'AIzaSyByagNTSU4t3SXMFKFnO949-Xx6PvJp7Wk';
  constructor() { }

  getStaticMapRouteUrl(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const path = `path=color:0xff0000ff|weight:2|${lat1},${lng1}|${lat2},${lng2}`;
    const size = '1920x300';
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${size}&maptype=roadmap&${path}&key=${this.apiKey}`;
    return mapUrl;
  }
  getStaticMapUrl(lat: number, lng: number, zoom: number = 15, width: number = 600, height: number = 400): string {
    const size = `${width.toString()}x${height.toString()}`;
    const iconUrl = encodeURIComponent('https://firebasestorage.googleapis.com/v0/b/xploramxv2.firebasestorage.app/o/hotel-pin.png?alt=media&token=747109a6-69a4-451b-9c74-90473a525071');
    //const marker = `icon:${iconUrl}|${lat},${lng}`;
    const marker = `color:blue|label:H|${lat},${lng}`;
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&scale=2&maptype=roadmap&markers=${marker}&format=jpg&key=${this.apiKey}`;
    return mapUrl;
  }
}

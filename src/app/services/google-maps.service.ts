import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private apiKey: string = 'AIzaSyDjJYipKybawD3UwTlCg32ovO-bOpbvtm8';
  constructor() { }

  getStaticMapUrl(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const path = `path=color:0xff0000ff|weight:2|${lat1},${lng1}|${lat2},${lng2}`;
    const size = '1920x300';
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${size}&maptype=roadmap&${path}&key=${this.apiKey}`;
    return mapUrl;
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleDirectionsService {
  directionsService = new google.maps.DirectionsService;
  constructor() { }
  async getRoute(
    origin: string | google.maps.LatLng | google.maps.Place | google.maps.LatLngLiteral, 
    destination: string | google.maps.LatLng | google.maps.Place | google.maps.LatLngLiteral
  ):Promise<google.maps.DirectionsResult> {
    return this.directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC
    })
  }
}

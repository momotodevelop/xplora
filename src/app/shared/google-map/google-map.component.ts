import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-google-map',
  templateUrl: './google-map.component.html',
  imports: []
})
export class GoogleMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('windowInfo', { static: true }) info!: ElementRef;
  @Input() lat!:number;
  @Input() lng!:number;
  @Input() name!:string;
  private map!: google.maps.Map;

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.initMap();
  }

  private async initMap(): Promise<void> {
    const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
    this.map = new Map(this.mapContainer.nativeElement, {
      center: { lat: this.lat, lng: this.lng },
      zoom: 15,
      mapId: '3fa3aff20078adf1'
    });
    const marker = new AdvancedMarkerElement({
      map: this.map,
      position: { lat: this.lat, lng: this.lng },
      content: this.info.nativeElement, // Asigna el elemento nativo
    });
  }
}

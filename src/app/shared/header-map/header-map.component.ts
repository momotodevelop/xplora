import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { GoogleMap, GoogleMapsModule } from '@angular/google-maps';

@Component({
    selector: 'app-header-map',
    imports: [GoogleMapsModule],
    templateUrl: './header-map.component.html',
    styleUrls: ['./header-map.component.scss']
})
export class HeaderMapComponent implements OnChanges {
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  zoom = 12;
  @Input() lat!: number;
  @Input() lng!: number;
  center: google.maps.LatLngLiteral = { lat: 0, lng: 0 }; // Valores predeterminados

  options: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    scrollwheel: false,
    disableDoubleClickZoom: true,
    maxZoom: 15,
    minZoom: 8,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    gestureHandling: 'none',
    clickableIcons: false,
    disableDefaultUI: true,
    styles: [
      {
        "featureType": "administrative",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative.country",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative.land_parcel",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative.locality",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative.neighborhood",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "administrative.province",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "landscape",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "poi",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "road.arterial",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "stylers": [
          {
            "visibility": "simplified"
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
          {
            "color": "#004aad"
          },
          {
            "weight": 0.5
          }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "transit",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "transit.station.airport",
        "stylers": [
          {
            "visibility": "on"
          }
        ]
      },
      {
        "featureType": "transit.station.airport",
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "on"
          },
          {
            "weight": 3
          }
        ]
      },
      {
        "featureType": "transit.station.airport",
        "elementType": "labels.icon",
        "stylers": [
          {
            "color": "#004aad"
          },
          {
            "visibility": "on"
          },
          {
            "weight": 2.5
          }
        ]
      },
      {
        "featureType": "transit.station.airport",
        "elementType": "labels.text.fill",
        "stylers": [
          {
            "color": "#004aad"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      }
    ]
  };  

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lat'] || changes['lng']) {
      this.center = { lat: this.lat, lng: this.lng };
      if (this.map) {
        this.map.panTo(this.center);
      }
    }
  }
}

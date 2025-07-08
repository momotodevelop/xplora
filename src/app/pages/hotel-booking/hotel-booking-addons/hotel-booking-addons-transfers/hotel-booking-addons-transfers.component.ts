import { Component, ElementRef, Input, model, ViewChild } from '@angular/core';
import { AirportSearchService } from '../../../../services/airport-search.service';
import { GoogleDirectionsService } from '../../../../services/google-directions.service';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AmadeusLocation } from '../../../../types/amadeus-airport-response.types';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { faBus, faCar, faExchangeAlt, faGem, faHotel, faLongArrowAltLeft, faLongArrowAltRight, faPlane, faPlaneArrival, faPlaneDeparture, faPlusCircle, faShuttleVan, faStopwatch, faSuitcase, faSuitcaseRolling, faUser, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatIconModule } from '@angular/material/icon';
import { HotelBookingAddonTransferChargeItemComponent } from './hotel-booking-addon-transfer-charge-item/hotel-booking-addon-transfer-charge-item.component';

interface Vehicle{
  id: string,
  capacity: number,
  type: string,
  icon: IconDefinition,
  model: string
}

interface TransferFare{
  type: "SHARED"|"PRIVATE",
  vehicle: Vehicle,
  name: string,
  pricePerPax: {
    km: number,
    time: number
  },
  image: string,
  active: boolean,
  billedPax: number,
  capacityPerPax:{
    baggage: number,
    handBaggage: number
  },
  basePrice: number
}

interface DisplayTransferFare extends TransferFare{
  prices: TransferPrices
}

interface TransferPrices{
  total: number,
  unit: {
    total: number,
    distance: number,
    time: number,
    pricePerPassenger: number
  },
  requiredUnits: number
}

export const VEHICLES = {
  SEDAN: {
    id: "SEDAN",
    capacity: 4,
    type: "Sedan estándar",
    icon: faCar,
    model: "VW Jetta"
  },
  MINIVAN: {
    id: "MINIVAN", 
    capacity: 8,
    type: "Minivan estándar",
    icon: faShuttleVan,
    model: "VW Transporter"
  },
  BUS: {
    id: "BUS",  
    capacity: 40,
    type: "Autobús estándar",
    icon: faBus,
    model: "Scania i6"
  },
  LUXURY: {
    id: "LUXURY",
    capacity: 6,
    type: "SUV de Lujo",
    icon: faGem,
    model: "Chevrolet Suburban"
  }
}

export const TRANSFER_FARES: TransferFare[] = [
  {
    type: "SHARED",
    name: "Compartido Minivan",
    pricePerPax: {
      km: 1.0,    // Subimos de 0.8 a 1.0 para ser competitivos 
      time: 0.1   // Subimos un poco el factor tiempo
    },
    image: '/assets/img/transfer-types/MINIVAN.jpg',
    active: true,
    billedPax: 1,
    basePrice: 0,
    capacityPerPax: {
      baggage: 1,
      handBaggage: 1
    },
    vehicle: VEHICLES.MINIVAN
  },
  {
    type: "SHARED",
    name: "Compartido Autobús",
    pricePerPax: {
      km: 0.9, 
      time: 0.09
    },
    image: '/assets/img/transfer-types/BUS.jpg',
    active: true,
    billedPax: 1,
    basePrice: 0,
    capacityPerPax: {
      baggage: 1,
      handBaggage: 1
    },
    vehicle: VEHICLES.BUS
  },
  {
    type: "PRIVATE",
    name: "Privado Minivan",
    pricePerPax: {
      km: 1.2,   // Subimos de 0.8 a 1.2
      time: 0.12
    },
    image: '/assets/img/transfer-types/MINIVAN.jpg',
    active: true,
    billedPax: 8,
    basePrice: 0,
    capacityPerPax: {
      baggage: 1,
      handBaggage: 1
    },
    vehicle: VEHICLES.MINIVAN
  },
  {
    type: "PRIVATE",
    name: "Auto Estándar",
    pricePerPax: {
      km: 1.5,   // Subimos de 0.9 a 1.5
      time: 0.15
    },
    image: '/assets/img/transfer-types/SEDAN.jpg',
    active: true,
    billedPax: 4,
    basePrice: 0,
    capacityPerPax: {
      baggage: 1,
      handBaggage: 1
    },
    vehicle: VEHICLES.SEDAN
  },
  {
    type: "PRIVATE",
    name: "Luxury",
    pricePerPax: {
      km: 2.5,   // Subimos de 2.0 a 2.5 (SUV de lujo)
      time: 0.25
    },
    image: '/assets/img/transfer-types/SUBURBAN.jpg',
    active: true,
    billedPax: 6,
    basePrice: 0,
    capacityPerPax: {
      baggage: 1,
      handBaggage: 1
    },
    vehicle: VEHICLES.LUXURY
  }
];

@Component({
  selector: 'app-hotel-booking-addons-transfers',
  imports: [
    MatExpansionModule,
    MatCheckboxModule, 
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatListModule,
    MatRadioModule,
    FontAwesomeModule,
    MatIconModule,
    HotelBookingAddonTransferChargeItemComponent
  ],
  templateUrl: './hotel-booking-addons-transfers.component.html',
  styleUrl: './hotel-booking-addons-transfers.component.scss'
})
export class HotelBookingAddonsTransfersComponent {
  constructor(
    private airports:AirportSearchService,
    private directions: GoogleDirectionsService,
    private fb: FormBuilder
  ){}
  @Input() lat!:number;
  @Input() lng!:number;
  @Input()  guests!:number;
  @Input() hotelName!:string;
  displayTransferFares?:DisplayTransferFare[];
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  nearbyAirports: AmadeusLocation[] = [];
  loading:boolean = true;
  directionsRenderer = new google.maps.DirectionsRenderer();
  map?:google.maps.Map;
  airportSelector:FormControl<string|null> = new FormControl(null);
  actualAirport?:string;
  fareInput:FormControl = new FormControl();
  selectedFare?:DisplayTransferFare;
  paxIcon=faUser;
  baggageIcon=faSuitcase;
  handBaggageIcon=faSuitcaseRolling;
  roundtripIcon=faExchangeAlt;
  airportHotelIcon=faLongArrowAltRight;
  hotelAirportIcon=faLongArrowAltLeft;
  airportArrival=faPlaneArrival;
  airportDeparture=faPlaneDeparture;
  hotelIcon=faHotel;
  airportIcon=faPlane;
  stopIcon=faStopwatch;
  moreIcon=faPlusCircle;
  legs?:google.maps.DirectionsLeg;
  distance:number=0;
  time:number=0;
  transferType:"ROUND"|"HOTEL"|"APTO"="ROUND";
  ngOnInit(): void {
    //console.log(this.hotelName);
    this.airportSelector.valueChanges.subscribe(airport=>{
      if(airport){
        this.changeAirport(airport!);
      }
    });
    this.fareInput.valueChanges.subscribe(fareI=>{
      const fare = this.displayTransferFares![fareI[0]];
      this.selectedFare = fare?fare:undefined;
    });
    this.airports.getNearbyAirports(this.lat, this.lng).subscribe(airports=>{
      //console.log(airports.data[0].address.countryName);
      this.loading = false;
      this.nearbyAirports = airports.data;
      if(airports.data.length>0){
        this.airportSelector.setValue(airports.data[0].iataCode);
      }
    });
  }
  async initMap(lat:number, lng:number){
    const { Map }  = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
    const map = new Map(this.mapContainer.nativeElement, {
      center: {lat, lng},
      zoom: 8,
      disableDefaultUI: true
    });
    this.directionsRenderer.setMap(map);
    this.map = map;
    return map;
  }
  changeTransferType(type:"ROUND"|"HOTEL"|"APTO"){
    this.transferType = type; 
  }
  changeRadio($event:MatRadioChange){
    //console.log($event); 
    const fare = this.displayTransferFares![$event.value];
    this.selectedFare = fare?fare:undefined;
  }
  isFullCar(){
    return this.selectedFare!.vehicle.capacity>=this.guests;
  }
  getRoute(origin:{lat:number,lng:number}, destination: {lat:number,lng:number}){
    this.directions.getRoute({lat: origin.lat, lng: origin.lng}, {lat: destination.lat,lng: destination.lng}).then(route=>{
      this.directionsRenderer.setDirections(route);
      this.legs=route.routes[0].legs[0];
      this.distance = Math.round(this.legs!.distance!.value/1000);
      this.time = Math.round(this.legs!.duration!.value/60);
      //console.log(this.legs);
      this.displayTransferFares = TRANSFER_FARES.map(fare=>{
        return {
          ...fare,
          prices: this.calculatePrices(fare,route.routes[0].legs[0].distance!.value, route.routes[0].legs[0].duration!.value, this.guests)
        }
      });
      //console.log(this.displayTransferFares);
    });
  }
  changeAirport(airportIata:string){
    const airport = this.nearbyAirports.find(airport=>airport.iataCode===airportIata)!;
    if(!this.map){
      this.initMap(airport.geoCode.latitude, airport.geoCode.longitude);
    }else{
      this.map.setCenter({lat: airport.geoCode.latitude, lng: airport.geoCode.longitude});
    }
    this.getRoute({lat: airport.geoCode.latitude, lng: airport.geoCode.longitude}, {lat: this.lat, lng: this.lng});
  }
  calculatePrices(fare: TransferFare, distance:number, time:number, passengers:number):any{
    const distanceTotal = this.distance*fare.pricePerPax.km;
    const timeTotal = this.time*fare.pricePerPax.time;
    const totalPerPax = distanceTotal + timeTotal;
    const unitCost = (totalPerPax*fare.billedPax)+fare.basePrice;
    const requiredUnits = fare.type==='SHARED' ? Math.ceil(passengers/1) : Math.ceil(passengers/fare.vehicle.capacity);
    return {
      total: unitCost*requiredUnits,
      unit: {
        total: unitCost,
        distance: distanceTotal,
        time: timeTotal,
        basePrice: fare.basePrice,
        pricePerPassenger: Math.round(unitCost/fare.billedPax)
      },
      requiredUnits: requiredUnits
    };
  }
}

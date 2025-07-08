import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DepartureArrival, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import * as _ from 'lodash';
import { AddCarryOnComponent, ExtraBaggageData } from './add-carry-on/add-carry-on.component';
import { AddFlexPassComponent } from './add-flex-pass/add-flex-pass.component';
import { AddPremiumInsuranceComponent } from './add-insurance/add-insurance.component';
import { AddBaggageComponent } from './add-baggage/add-baggage.component';
import { CommonModule } from '@angular/common';
import { XploraApiService } from '../../../services/xplora-api.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronRight, faSpinner, faSync, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { AdditionalServiceItem, FlightAdditionalServiceItem, FlightAdditionalServices, FlightFirebaseBooking } from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';

export const ExtrasPrices = {
  insurance: 109,
  flexpass: 49,
  carryon: 399,
  baggage: 499
}

export interface ExtraServiceData{
  outbound: FlightAdditionalServiceItem[],
  inbound: FlightAdditionalServiceItem[]
}

export interface ExtraServiceBottomSheetData{
  flights: {
    departure:DepartureArrival;
    arrival: DepartureArrival;
  }[];
  passengers: {name: string, type: "Adulto"|"Menor"}[];
  saved: ExtraServiceData,
  price: number
}

@Component({
    selector: 'app-extras',
    imports: [MatCardModule, MatButtonModule, MatBottomSheetModule, CommonModule, FontAwesomeModule],
    templateUrl: './extras.component.html',
    styleUrl: './extras.component.scss'
})
export class ExtrasComponent implements OnInit {
  @Output() next:EventEmitter<void> = new EventEmitter();
  @Output() skip:EventEmitter<void> = new EventEmitter();
  constructor(
    private dialog: MatBottomSheet,
    private bookingHandler:BookingHandlerService,
    private xplora: XploraApiService,
    private fireBooking: FireBookingService
  ){}
  booking?:FlightFirebaseBooking;
  total:number=0;
  insuranceTotal:number=0;
  flexpassTotal:number=0;
  carryOnTotal:number=0;
  baggageTotal:number=0;
  isUpdate:boolean=false;
  nextIcon=faChevronRight;
  spinnerIcon=faSpinner;
  updateIcon=faSync;
  saveIcon=faFloppyDisk;
  loading:boolean=false;
  additionalServices?:FlightAdditionalServices;
  ngOnInit(){
    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.booking = booking;
        if(booking.flightDetails.aditionalServices){
          this.isUpdate=true;
          const aditionalServices = booking.flightDetails.aditionalServices;
          this.additionalServices = aditionalServices ?? [];
          this.updateExtrasTotal();
        }
      }
    });
  }
  get insuranceActive() {
    return this.additionalServices?.insurance;
  }

  get flexpass() {
    return this.additionalServices?.flexpass;
  }

  get baggage() {
    return this.additionalServices?.baggage;
  }

  get carryOn() {
    return this.additionalServices?.carryOn;
  }

  hasAdditionalServicesChanged(
    original: ExtraServiceData,
    current: ExtraServiceData
  ): boolean {
    return (
      !_.isEqual(original.outbound, current.outbound) ||
      !_.isEqual(original.inbound, current.inbound)
    );
  }

  openInsurance(){
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const passengers = this.booking!.flightDetails.passengers.details!.filter(passenger=>passenger.type!=="INFANT");
    const data:ExtraServiceBottomSheetData = {
      passengers: passengers.map(passenger=>{
        return {
          name: passenger.name+' '+passenger.lastname,
          type: passenger.type==='ADULT'?'Adulto':'Menor'
        }
      }),
      flights: flights.map(flight=>{
        return {
          departure: flight.itineraries[0].segments[0].departure,
          arrival: _.last(flight.itineraries[0].segments)!.arrival
        }
      }),
      saved: this.insuranceActive!,
      price: ExtrasPrices.insurance
    }
    this.dialog.open(AddPremiumInsuranceComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.additionalServices!.insurance = value;
          this.updateExtrasTotal();
          this.fireBooking.nestedUpdateBooking(this.booking!.bookingID!, {
            "flightDetails.aditionalServices.insurance": value
          }).then(ok=>{
            this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
          });
      }
    })
  }
  openFlexPass(){
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const passengers = this.booking!.flightDetails.passengers.details!.filter(passenger=>passenger.type!=="INFANT");
    const data:ExtraServiceBottomSheetData = {
      passengers: passengers.map(passenger=>{
        return {
          name: passenger.name+' '+passenger.lastname,
          type: passenger.type==='ADULT'?'Adulto':'Menor'
        }
      }),
      flights: flights.map(flight=>{
        return {
          departure: flight.itineraries[0].segments[0].departure,
          arrival: _.last(flight.itineraries[0].segments)!.arrival
        }
      }),
      saved: this.flexpass!,
      price: ExtrasPrices.flexpass
    }
    this.dialog.open(AddFlexPassComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.additionalServices!.flexpass = value;
        this.updateExtrasTotal();
        this.fireBooking.nestedUpdateBooking(this.booking!.bookingID!, {
          "flightDetails.aditionalServices.flexpass": value
        }).then(ok=>{
          this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
        });
      }
    })
  }
  openCarryOn(){
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const passengers = this.booking!.flightDetails.passengers.details!.filter(passenger=>passenger.type!=="INFANT");
    const data:ExtraServiceBottomSheetData = {
      passengers: passengers.map(passenger=>{
        return {
          name: passenger.name+' '+passenger.lastname,
          type: passenger.type==='ADULT'?'Adulto':'Menor'
        }
      }),
      flights: flights.map(flight=>{
        return {
          departure: flight.itineraries[0].segments[0].departure,
          arrival: _.last(flight.itineraries[0].segments)!.arrival
        }
      }),
      saved: this.carryOn!,
      price: ExtrasPrices.carryon
    }
    this.dialog.open(AddCarryOnComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.additionalServices!.carryOn = value;
        this.updateExtrasTotal();
        this.fireBooking.nestedUpdateBooking(this.booking!.bookingID!, {
          "flightDetails.aditionalServices.carryOn": value
        }).then(ok=>{
          this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
        });
      }
    })
  }
  openBaggage(){
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const passengers = this.booking!.flightDetails.passengers.details!.filter(passenger=>passenger.type!=="INFANT");
    const data:ExtraServiceBottomSheetData = {
      passengers: passengers.map(passenger=>{
        return {
          name: passenger.name+' '+passenger.lastname,
          type: passenger.type==='ADULT'?'Adulto':'Menor'
        }
      }),
      flights: flights.map(flight=>{
        return {
          departure: flight.itineraries[0].segments[0].departure,
          arrival: _.last(flight.itineraries[0].segments)!.arrival
        }
      }),
      saved: this.additionalServices!.baggage!,
      price: ExtrasPrices.baggage
    }
    this.dialog.open(AddBaggageComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.additionalServices!.baggage = value;
        this.updateExtrasTotal();
        this.fireBooking.nestedUpdateBooking(this.booking!.bookingID!, {
          "flightDetails.aditionalServices.baggage": value
        }).then(ok=>{
          this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
        });
      }
    })
  }
  updateExtrasTotal() {
    let total = 0;
  
    const aditional = this.additionalServices;
    if (!aditional) return;
  
    const sumServices = (items?: FlightAdditionalServiceItem[]) => {
      return items?.reduce((acc, item) => acc + (item.value*item.unitPrice), 0) || 0;
    };
  
    // Seguro
    const insuranceTotal =
      sumServices(aditional.insurance!.outbound) +
      sumServices(aditional.insurance!.inbound);
    this.insuranceTotal = insuranceTotal;
    total += insuranceTotal;
  
    // Flexpass
    const flexpassTotal =
      sumServices(aditional.flexpass!.outbound) +
      sumServices(aditional.flexpass!.inbound);
    this.flexpassTotal = flexpassTotal;
    total += flexpassTotal;
  
    // Equipaje de mano
    const carryOnTotal =
      sumServices(aditional.carryOn!.outbound) +
      sumServices(aditional.carryOn!.inbound);
    this.carryOnTotal = carryOnTotal;
    total += carryOnTotal;
  
    // Equipaje documentado
    const baggageTotal =
      sumServices(aditional.baggage!.outbound) +
      sumServices(aditional.baggage!.inbound);
    this.baggageTotal = baggageTotal;
    total += baggageTotal;
    // Asignación total y activación de cambios
    this.total = total;
    //this.hasChanges = true;
  }  
  saveExtras(){
    const aditionalServices = {
      insurance: this.insuranceActive,
      flexpass: this.flexpass,
      carryon: this.carryOn,
      baggage: this.baggage
    }
    this.loading=true;
    this.fireBooking.updateBooking(this.booking!.bookingID!, {
      flightDetails: {
        ...this.booking!.flightDetails,
        aditionalServices
      }
    }).then(ok=>{
      this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
    });
  }
}
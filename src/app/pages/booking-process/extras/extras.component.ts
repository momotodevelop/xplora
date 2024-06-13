import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
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

export const ExtrasPrices = {
  insurance: 109,
  flexpass: 49,
  carryon: 399,
  baggage: 499
}

export interface ExtraServiceBottomSheetData{
  flights: {
    departure:DepartureArrival;
    arrival: DepartureArrival;
  }[];
  passengers: {name: string, type: "Adulto"|"Menor"}[];
  saved?: any,
  price: number
}

@Component({
  selector: 'app-extras',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatBottomSheetModule, CommonModule],
  templateUrl: './extras.component.html',
  styleUrl: './extras.component.scss'
})
export class ExtrasComponent implements OnInit {
  @Output() next:EventEmitter<void> = new EventEmitter();
  constructor(private dialog: MatBottomSheet, private bookingHandler:BookingHandlerService, private xplora: XploraApiService){}
  booking?:XploraFlightBooking;
  insuranceActive?:number[][];
  flexpass?:number[][];
  carryOn?:ExtraBaggageData[][];
  baggage?:ExtraBaggageData[][];
  total:number=0;
  insuranceTotal:number=0;
  flexpassTotal:number=0;
  carryOnTotal:number=0;
  baggageTotal:number=0;
  hasChanges:boolean=false;
  isUpdate:boolean=false;
  ngOnInit(){
    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.booking = booking;
        if(booking.aditionalServices){
          this.isUpdate=true;
          const aditionalServices = booking.aditionalServices;
          if(aditionalServices.insurance!==undefined) this.insuranceActive=aditionalServices.insurance;
          if(aditionalServices.flexpass!==undefined) this.flexpass=aditionalServices.flexpass;
          if(aditionalServices.carryon!==undefined) this.carryOn=aditionalServices.carryon;
          if(aditionalServices.baggage!==undefined) this.baggage=aditionalServices.baggage;
          this.updateExtrasTotal();
          this.hasChanges=false;
        }
      }
    });
  }
  openInsurance(){
    const flights:FlightOffer[] = [this.booking!.flights!.outbound!.offer]
    if(this.booking!.round){
      flights.push(this.booking!.flights!.inbound!.offer)
    }
    const passengers = this.booking!.passengersData!.filter(passenger=>passenger.type!=="INFANT");
    const defaultData:number[] = passengers.map((passenger,i) => {return i});
    console.log(defaultData);
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
      saved: this.insuranceActive ?? [defaultData, defaultData],
      price: ExtrasPrices.insurance
    }
    this.dialog.open(AddPremiumInsuranceComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.insuranceActive = value;
        this.updateExtrasTotal();
      }
    })
  }
  openFlexPass(){
    const flights:FlightOffer[] = [this.booking!.flights!.outbound!.offer]
    if(this.booking!.round){
      flights.push(this.booking!.flights!.inbound!.offer)
    }
    const passengers = this.booking!.passengersData!.filter(passenger=>passenger.type!=="INFANT");
    const defaultData:number[] = passengers.map((passenger,i) => {return i});
    console.log(defaultData);
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
      saved: this.flexpass ?? [defaultData, defaultData],
      price: ExtrasPrices.flexpass
    }
    this.dialog.open(AddFlexPassComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.flexpass = value;
        this.updateExtrasTotal();
      }
    })
  }
  openCarryOn(){
    const flights:FlightOffer[] = [this.booking!.flights!.outbound!.offer]
    if(this.booking!.round){
      flights.push(this.booking!.flights!.inbound!.offer)
    }
    const passengers = this.booking!.passengersData!.filter(passenger=>passenger.type!=="INFANT");
    const defaultData:ExtraBaggageData[][] = flights.map(flight=>{
      return passengers.map((passenger,i) => {return {
        passengerID: i,
        pieces: 0
      }});
    });
    console.log(defaultData);
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
      saved: this.carryOn ?? defaultData,
      price: ExtrasPrices.carryon
    }
    this.dialog.open(AddCarryOnComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.carryOn = value;
        this.updateExtrasTotal();
      }
    })
  }
  openBaggage(){
    const flights:FlightOffer[] = [this.booking!.flights!.outbound!.offer]
    if(this.booking!.round){
      flights.push(this.booking!.flights!.inbound!.offer)
    }
    const passengers = this.booking!.passengersData!.filter(passenger=>passenger.type!=="INFANT");
    const defaultData:ExtraBaggageData[][] = flights.map(flight=>{
      return passengers.map((passenger,i) => {return {
        passengerID: i,
        pieces: 0
      }});
    });
    console.log(defaultData);
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
      saved: this.baggage ?? defaultData,
      price: ExtrasPrices.baggage
    }
    this.dialog.open(AddBaggageComponent, {panelClass: 'custom-bottom-sheet', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.baggage = value;
        this.updateExtrasTotal();
      }
    })
  }
  updateExtrasTotal(){
    let total=0;
    if(this.insuranceActive!==undefined){
      let insuranceTotal=0;
      this.insuranceActive.forEach(insuranceFlight=>{
        insuranceFlight.forEach(insurancePassanger=>{
          insuranceTotal+=ExtrasPrices.insurance
        })
      });
      total+=insuranceTotal;
      this.insuranceTotal=insuranceTotal;
    }
    if(this.flexpass!==undefined){
      let flexPassTotal=0;
      this.flexpass.forEach(flexPassFlight=>{
        flexPassFlight.forEach(flexPassPassenger=>{
          flexPassTotal+=ExtrasPrices.flexpass;
        })
      });
      total+=flexPassTotal;
      this.flexpassTotal=flexPassTotal;
    }
    if(this.carryOn!==undefined){
      let carryOnTotal=0;
      this.carryOn.forEach(fligthCarryOn=>{
        fligthCarryOn.forEach(carryOnPassenger=>{
          carryOnTotal+=carryOnPassenger.pieces*ExtrasPrices.carryon;
        })
      });
      total+=carryOnTotal;
      this.carryOnTotal=carryOnTotal;
    }
    if(this.baggage!==undefined){
      let baggageTotal=0;
      this.baggage.forEach(baggageCarryOn=>{
        baggageCarryOn.forEach(baggagePassenger=>{
          baggageTotal+=baggagePassenger.pieces*ExtrasPrices.baggage;
        });
      });
      total+=baggageTotal;
      this.baggageTotal=baggageTotal;
    }
    this.total=total;
    this.hasChanges=true;
  }
  saveExtras(){
    const aditionalServices = {
      insurance: this.insuranceActive,
      flexpass: this.flexpass,
      carryon: this.carryOn,
      baggage: this.baggage
    }
    this.xplora.updateBooking(this.booking!.bookingID, {aditionalServices}).subscribe(updated=>{
      this.bookingHandler.setBookingInfo(updated.booking);
      this.next.emit();
    });
  }
}
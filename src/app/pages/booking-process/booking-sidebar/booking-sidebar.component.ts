import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FareDetailsBySegment, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import * as _ from 'lodash'
import { DateStringPipe } from '../../../date-string.pipe';
import { RemoveCharactersPipe } from '../../../meridian-parser.pipe';
import { DurationPipe } from '../../../duration.pipe';
import { Promo, XploraPromosService } from '../../../services/xplora-promos.service';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { String } from 'aws-sdk/clients/cloudsearch';
import { MatInputModule } from '@angular/material/input';
import { ExtrasPrices } from '../extras/extras.component';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { MatIconModule } from '@angular/material/icon';
import { UppercaseDirective } from '../../../uppercase.directive';
import { AmadeusAirlinesService } from '../../../services/amadeus-airlines.service';
import { BrandfetchService } from '../../../services/brandfetch.service';
import { FirebaseBooking, FlightAdditionalServiceItem, FlightFirebaseBooking } from '../../../types/booking.types';

export interface Charge{
  amount: number,
  description: string,
  currency?: string,
  aditional_info?: string[]
}

@Component({
    selector: 'app-booking-sidebar',
    imports: [CommonModule, DateStringPipe, RemoveCharactersPipe, DurationPipe, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, UppercaseDirective, CurrencyPipe],
    templateUrl: './booking-sidebar.component.html',
    providers: [CurrencyPipe],
    styleUrl: './booking-sidebar.component.scss'
})
export class BookingSidebarComponent implements OnInit{
  @Output() openInsuranceExtra: EventEmitter<void> = new EventEmitter();
  booking?:FlightFirebaseBooking;
  dates!: {outbound:Date[], inbound?:Date[]};
  promoControl: FormControl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  appliedPromo?:Promo;
  loadingPromo:boolean=false;
  discountedAmmount?:number;
  flightCharges:Charge[]=[];
  aditionalServiceCharges:Charge[]=[];
  grandTotal:number=0;
  totalPassengers:number=0;
  chargeablePassengers:number=0;
  activeInsurance:number=0;
  outboundAirlineCode?:string;
  inboundAirlineCode?:string;
  outboundAirlineBrand?:string;
  inboundAirlineBrand?:string;
  constructor(private promos: XploraPromosService, private _sb: MatSnackBar, public bookingHandler:BookingHandlerService, private currencyPipe: CurrencyPipe, private airlines: AmadeusAirlinesService, private brandfetch: BrandfetchService){
    
  }
  ngOnInit(): void {
    this.bookingHandler.booking.subscribe(booking=>{
      this.aditionalServiceCharges = [];
      this.flightCharges = [];
      console.log(booking);
      if(booking!==undefined){
        this.booking = booking;
        this.totalPassengers = booking.flightDetails.passengers.counts.adults+booking.flightDetails.passengers.counts.childrens+booking.flightDetails.passengers.counts.infants;
        this.chargeablePassengers = booking.flightDetails.passengers.counts.adults+booking.flightDetails.passengers.counts.childrens;
        this.dates = {
          outbound: [
            new Date(this.booking.flightDetails.flights.outbound!.offer!.itineraries[0].segments[0].departure.at),
            new Date(_.last(this.booking.flightDetails.flights.outbound!.offer!.itineraries[0].segments)!.arrival.at)
          ]
        }
        if(booking.flightDetails.flights.outbound!==undefined){
          this.flightCharges = [
            {
              description: booking.flightDetails.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.priceMultiplier(booking.flightDetails.flights.outbound.offer.price.base),
              aditional_info: ["Tarifa Aerea"]
            },
            {
              description: booking.flightDetails.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.priceMultiplier(parseInt(booking.flightDetails.flights.outbound.offer.price.grandTotal as string)-parseInt(booking.flightDetails.flights.outbound.offer.price.base as string)),
              aditional_info: ["Impuestos"]
            }
          ]
          this.outboundAirlineCode = booking.flightDetails.flights.outbound!.offer.validatingAirlineCodes[0];
        }
        if(booking.flightDetails.round&&booking.flightDetails.flights.inbound!==undefined){
          this.dates.inbound = [
            new Date(this.booking.flightDetails.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
            new Date(_.last(booking.flightDetails.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
          ]
          this.flightCharges.push({
            description: booking.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.priceMultiplier(booking.flightDetails.flights.inbound.offer.price.base),
            aditional_info: ["Tarifa Aerea"]
          });
          this.flightCharges.push({
            description: booking.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.priceMultiplier(parseInt(booking.flightDetails.flights.inbound.offer.price.grandTotal as string)-parseInt(booking.flightDetails.flights.inbound.offer.price.base as string)),
            aditional_info: ["Impuestos"]
          });
          this.inboundAirlineCode = booking.flightDetails.flights.inbound.offer.validatingAirlineCodes[0];
        }
        if (this.booking.flightDetails?.aditionalServices) {
          const aditional = this.booking.flightDetails.aditionalServices;

          const getActives = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]}) => {
            const outbound = additionals.outbound.filter(item => item.value>0).length;
            const inbound = additionals.inbound.filter(item => item.value>0).length;
            return outbound + inbound;
          };
          const getPieces = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]})=>{
            const outboundPieces = additionals.outbound.reduce((total, item) => total + item.value, 0);
            const inboundPieces = additionals.inbound.reduce((total, item) => total + item.value, 0);
            return outboundPieces + inboundPieces;
          }
          
          const insuranceActives = getActives(aditional.insurance!);
          const flexpassActives = getActives(aditional.flexpass!);
          const carryonActives = getPieces(aditional.carryOn!);
          const baggageActives = getPieces(aditional.baggage!);
          if(insuranceActives>0){
            this.aditionalServiceCharges.push({
              description: 'Allianz Travel Premium',
              amount: Math.round(ExtrasPrices.insurance * insuranceActives)
            });
          }
          if(flexpassActives>0){
            this.aditionalServiceCharges.push({
              description: 'FlexPass',
              amount: Math.round(ExtrasPrices.flexpass * flexpassActives)
            });
          }
          if(carryonActives>0){
            this.aditionalServiceCharges.push({
              description: 'Equipaje de mano',
              amount: Math.round(ExtrasPrices.carryon * carryonActives)
            });
          }
          if(baggageActives>0){
            this.aditionalServiceCharges.push({
              description: 'Equipaje documentado',
              amount: Math.round(ExtrasPrices.baggage * baggageActives)
            });
          }
        }        
        this.updatePrice(booking);
        if(this.outboundAirlineCode){
          this.airlines.getAirlineInfo(this.outboundAirlineCode).subscribe(airline=>{
            this.brandfetch.getBrands(airline.data[0].businessName).subscribe(brands=>{
              this.outboundAirlineBrand = brands[0].domain;
            })
          });
        }
        if(this.inboundAirlineCode){
          this.airlines.getAirlineInfo(this.inboundAirlineCode).subscribe(airline=>{
            this.brandfetch.getBrands(airline.data[0].businessName).subscribe(brands=>{
              this.inboundAirlineBrand = brands[0].domain
            });
          });
        }
      }
    });
    this.bookingHandler.promo.subscribe(promo=>{
      this.appliedPromo = promo;
      if(this.booking!==undefined){
        console.log(promo);
        this.updatePrice(this.booking);
      }
    });
  }
  extrasTotal():number{
    let total:number=0;
    this.aditionalServiceCharges.forEach(charge=>{
      total+=charge.amount;
    });
    return total;
  }
  flightCabinText(fare:FareDetailsBySegment):string{
    let cabinName:string;
    switch(fare.cabin){
      case "ECONOMY": 
        cabinName = "ECONOMICA";
      break;
      case "PREMIUM_ECONOMY": 
        cabinName = "PREFERENTE";
      break;
      case "BUSINESS": 
        cabinName = "EJECUTIVA";
      break;
      case "FIRST": 
        cabinName = "PRIMERA";
      break;
    }
    return cabinName+(fare.brandedFare!==undefined?'/'+fare.brandedFareLabel:'');
  }
  getTravelDate(offer:FlightOffer, departure:boolean=true):string{
    let response:string;
    if(departure){
      response = offer.itineraries[0].segments[0].departure.at;
    }else{
      response = _.last(offer.itineraries[0].segments)!.arrival.at;
    }
    return response;
  }
  priceMultiplier(ammount:number|String):number{
    let ammountValue:number;
    if(typeof ammount==="string"){
      ammountValue=parseInt(ammount)
    }else{
      ammountValue = ammount;
    }
    return ammountValue*this.chargeablePassengers;
  }
  applyPromo(ammount:number, discount:number, type: 'percentage' | 'fixed'):number[]{
    const discountedAmmount:number = type==='fixed'?discount:(ammount*(discount/100))
    return [Math.round(ammount-discountedAmmount), Math.round(discountedAmmount)];
  }
  bookingTotalCalculator(booking:FlightFirebaseBooking):number{
    let flightTotal:number = this.priceMultiplier(booking.flightDetails.flights!.outbound!.offer.price.grandTotal);
    let discounted = 0;
    if(booking.flightDetails.round&&booking.flightDetails.flights!.inbound !== undefined){
      flightTotal += this.priceMultiplier(booking.flightDetails.flights!.inbound.offer.price.grandTotal);
    }
    if(this.appliedPromo!==undefined){
      const promoPrices = this.applyPromo(flightTotal, this.appliedPromo.discountAmount, this.appliedPromo.discountType);
      flightTotal = promoPrices[0];
      discounted = promoPrices[1]
      this.discountedAmmount = discounted;
    }
    if(this.extrasTotal()>0){
      flightTotal+=this.extrasTotal();
    }
    return flightTotal;
  }
  updatePrice(booking:FlightFirebaseBooking){
    this.grandTotal=this.bookingTotalCalculator(booking);
    const charges:Charge[] = [...this.flightCharges, {description: "Cargo por servicio", amount: 0, aditional_info: ["GRATIS"]}, ...this.aditionalServiceCharges]
    if(this.appliedPromo&&this.discountedAmmount){
      const discount:string = this.appliedPromo.discountType==="percentage"?this.appliedPromo.discountAmount+"%":this.currencyPipe.transform(this.appliedPromo.discountAmount, "MXN")!;
      let promoCharge:Charge = {
        amount: 0-this.discountedAmmount,
        description: this.appliedPromo.code+" [-"+discount+"]"
      }
      charges.push(promoCharge);
    }
    this.bookingHandler.setCharges(charges);
    console.log(charges);
    this.bookingHandler.setPricesInfo([this.grandTotal, this.discountedAmmount ?? 0]);
  }
  removePromo(){
    this.bookingHandler.setPromo(undefined);
    this.promoControl.reset();
    this.promoControl.enable();
    this.updatePrice(this.booking!);
  }
  getPromo(promoCode:string){
    this.promoControl.disable();
    this.promos.getPromoByCode(promoCode.toUpperCase()).subscribe({
      next: promo =>{
        if(promo){
          this.promoControl.setValue(promo.code);
          this._sb.open('Promoción '+promo.code+' aplicada.', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(promo);
          this.updatePrice(this.booking!);
        }else{
          console.log("Promo not found");
          this.promoControl.enable();
          this.bookingHandler.setPromo(undefined);
          this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
        }
      },
      error: err =>{
        this.promoControl.enable();
        this.bookingHandler.setPromo(undefined);
        this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
      }
    })
  }
}

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

export interface Charge{
  amount: number,
  description: string,
  aditional_info?: string
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
  booking?:XploraFlightBooking;
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
        this.totalPassengers = booking.passengers.adults+booking.passengers.childrens+booking.passengers.infants;
        this.chargeablePassengers = booking.passengers.adults+booking.passengers.childrens;
        this.dates = {
          outbound: [
            new Date(this.booking.flights.outbound!.offer!.itineraries[0].segments[0].departure.at),
            new Date(_.last(this.booking.flights.outbound!.offer!.itineraries[0].segments)!.arrival.at)
          ]
        }
        if(booking.flights.outbound!==undefined){
          this.flightCharges = [
            {
              description: booking.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.priceMultiplier(booking.flights.outbound.offer.price.base),
              aditional_info: "Tarifa Aerea"
            },
            {
              description: booking.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.priceMultiplier(parseInt(booking.flights.outbound.offer.price.grandTotal as string)-parseInt(booking.flights.outbound.offer.price.base as string)),
              aditional_info: "Impuestos"
            }
          ]
          this.outboundAirlineCode = booking.flights.outbound!.offer.validatingAirlineCodes[0];
        }
        if(booking.round&&booking.flights.inbound!==undefined){
          this.dates.inbound = [
            new Date(this.booking.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
            new Date(_.last(booking.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
          ]
          this.flightCharges.push({
            description: booking.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.priceMultiplier(booking.flights.inbound.offer.price.base),
            aditional_info: "Tarifa Aerea"
          });
          this.flightCharges.push({
            description: booking.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.priceMultiplier(parseInt(booking.flights.inbound.offer.price.grandTotal as string)-parseInt(booking.flights.inbound.offer.price.base as string)),
            aditional_info: "Impuestos"
          });
          this.inboundAirlineCode = booking.flights.inbound.offer.validatingAirlineCodes[0];
        }
        if(this.booking.aditionalServices!==undefined){
          if(this.booking.aditionalServices.insurance!==undefined){
            let insuranceTotal=0;
            this.booking.aditionalServices.insurance.forEach(insuranceFlight=>{
              insuranceFlight.forEach(insurancePassanger=>{
                insuranceTotal+=ExtrasPrices.insurance
              })
            });
            if(insuranceTotal>0){
              this.aditionalServiceCharges.push({
                description: "Allianz Travel Premium",
                amount: insuranceTotal
              });
            }
            this.activeInsurance = insuranceTotal;
          }
          if(this.booking.aditionalServices.flexpass!==undefined){
            let flexpassTotal:number=0;
            this.booking.aditionalServices.flexpass.forEach(flexPassFlight=>{
              flexPassFlight.forEach(()=>{
                flexpassTotal+=ExtrasPrices.flexpass;
              })
            });
            if(flexpassTotal>0){
              this.aditionalServiceCharges.push({
                description: "FlexPass",
                amount: flexpassTotal
              });
            }
          }
          if(this.booking.aditionalServices.carryon!==undefined){
            let carryOnTotal:number=0;
            this.booking.aditionalServices.carryon.forEach(fligthCarryOn=>{
              fligthCarryOn.forEach(carryOnPassenger=>{
                carryOnTotal+=carryOnPassenger.pieces*ExtrasPrices.carryon;
              })
            });
            if(carryOnTotal>0){
              this.aditionalServiceCharges.push({
                description: "Equipaje de mano",
                amount: carryOnTotal
              });
            }
          }
          if(this.booking.aditionalServices.baggage!==undefined){
            let baggageTotal:number=0;
            this.booking.aditionalServices.baggage.forEach(baggageCarryOn=>{
              baggageCarryOn.forEach(baggagePassenger=>{
                baggageTotal+=baggagePassenger.pieces*ExtrasPrices.baggage;
              });
            });
            if(baggageTotal>0){
              this.aditionalServiceCharges.push({
                description: "Equipaje documentado",
                amount: baggageTotal
              });
            }
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
  bookingTotalCalculator(booking:XploraFlightBooking):number{
    let flightTotal:number = this.priceMultiplier(booking.flights!.outbound!.offer.price.grandTotal);
    let discounted = 0;
    if(booking.round&&booking.flights!.inbound !== undefined){
      flightTotal += this.priceMultiplier(booking.flights!.inbound.offer.price.grandTotal);
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
  updatePrice(booking:XploraFlightBooking){
    this.grandTotal=this.bookingTotalCalculator(booking);
    const charges:Charge[] = [...this.flightCharges, {description: "Cargo por servicio", amount: 0, aditional_info: "GRATIS"}, ...this.aditionalServiceCharges]
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

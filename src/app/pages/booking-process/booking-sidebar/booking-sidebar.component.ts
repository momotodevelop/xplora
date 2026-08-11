import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FareDetailsBySegment, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import * as _ from 'lodash';
import { DurationPipe } from '../../../duration.pipe';
import { Promo, XploraPromosService } from '../../../services/xplora-promos.service';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExtrasPrices } from '../extras/extras.component';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { MatIconModule } from '@angular/material/icon';
import { UppercaseDirective } from '../../../uppercase.directive';
import { BrandfetchService } from '../../../services/brandfetch.service';
import { FlightAdditionalServiceItem, FlightFirebaseBooking } from '../../../types/booking.types';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { resolveAirlineLogoUrl } from '../../../utils/airline-logo.utils';

export interface Charge{
  amount: number,
  description: string,
  currency?: string,
  aditional_info?: string[]
}

@Component({
    selector: 'app-booking-sidebar',
    imports: [MatButtonModule, CommonModule, DurationPipe, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, UppercaseDirective, CurrencyPipe, FontAwesomeModule, MatTooltipModule],
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
  outboundAirlineLogoUrl:string = '';
  inboundAirlineLogoUrl:string = '';
  outboundAirlineBrand?:string;
  inboundAirlineBrand?:string;
  infoIcon = faCircleInfo;
  constructor(private promos: XploraPromosService, private _sb: MatSnackBar, public bookingHandler:BookingHandlerService, private currencyPipe: CurrencyPipe, private brandfetch: BrandfetchService){
    
  }
  ngOnInit(): void {
    this.bookingHandler.booking.subscribe(booking=>{
      this.aditionalServiceCharges = [];
      this.flightCharges = [];
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
          this.outboundAirlineLogoUrl = resolveAirlineLogoUrl(
            booking.flightDetails.flights.outbound.offer
          );
          this.flightCharges = [
            {
              description: booking.flightDetails.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.flightAmount(
                booking.flightDetails.flights.outbound.offer,
                booking.flightDetails.flights.outbound.offer.price.base
              ),
              aditional_info: ["Tarifa Aerea"]
            },
            {
              description: booking.flightDetails.flights.outbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.outbound.offer.itineraries[0].segments)!.arrival.iataCode,
              amount: this.flightAmount(
                booking.flightDetails.flights.outbound.offer,
                this.toAmount(booking.flightDetails.flights.outbound.offer.price.grandTotal)
                  - this.toAmount(booking.flightDetails.flights.outbound.offer.price.base)
              ),
              aditional_info: ["Impuestos"]
            }
          ]
          this.outboundAirlineCode = booking.flightDetails.flights.outbound!.offer.validatingAirlineCodes[0];
        }
        if(booking.flightDetails.round&&booking.flightDetails.flights.inbound){
          this.inboundAirlineLogoUrl = resolveAirlineLogoUrl(
            booking.flightDetails.flights.inbound.offer
          );
          this.dates.inbound = [
            new Date(this.booking.flightDetails.flights.inbound!.offer!.itineraries[0].segments[0].departure.at),
            new Date(_.last(booking.flightDetails.flights.inbound.offer!.itineraries[0].segments)!.arrival.at)
          ]
          this.flightCharges.push({
            description: booking.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.flightAmount(
              booking.flightDetails.flights.inbound.offer,
              booking.flightDetails.flights.inbound.offer.price.base
            ),
            aditional_info: ["Tarifa Aerea"]
          });
          this.flightCharges.push({
            description: booking.flightDetails.flights.inbound.offer.itineraries[0].segments[0].departure.iataCode+" - "+_.last(booking.flightDetails.flights.inbound.offer.itineraries[0].segments)!.arrival.iataCode,
            amount: this.flightAmount(
              booking.flightDetails.flights.inbound.offer,
              this.toAmount(booking.flightDetails.flights.inbound.offer.price.grandTotal)
                - this.toAmount(booking.flightDetails.flights.inbound.offer.price.base)
            ),
            aditional_info: ["Impuestos"]
          });
          this.inboundAirlineCode = booking.flightDetails.flights.inbound.offer.validatingAirlineCodes[0];
        }
        if (this.booking.flightDetails?.aditionalServices) {
          const aditional = this.booking.flightDetails.aditionalServices;
          const outboundSegments = booking.flightDetails.flights.outbound?.offer?.itineraries?.[0]?.segments ?? [];
          const inboundSegments = booking.flightDetails.round && booking.flightDetails.flights.inbound
            ? booking.flightDetails.flights.inbound.offer?.itineraries?.[0]?.segments ?? []
            : [];
          const outboundSegmentCount = outboundSegments.length || 1;
          const inboundSegmentCount = inboundSegments.length || 0;
          const outboundDurationFactor = this.segmentDurationFactor(outboundSegments);
          const inboundDurationFactor = this.segmentDurationFactor(inboundSegments);

          const getActives = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]}) => {
            const outbound = additionals.outbound.filter(item => (item.value ?? 0) > 0).length;
            const inbound = additionals.inbound.filter(item => (item.value ?? 0) > 0).length;
            return outbound + inbound;
          };
          const getPieces = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]})=>{
            const outboundPieces = additionals.outbound.reduce((total, item) => total + (item.value ?? 0), 0);
            const inboundPieces = additionals.inbound.reduce((total, item) => total + (item.value ?? 0), 0);
            return outboundPieces + inboundPieces;
          }
          const getChargeableCarryOnPieces = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]})=>{
            const getChargeable = (item:FlightAdditionalServiceItem) => {
              const includedQuantity = Number(item.metadata?.['includedQuantity'] ?? 0);
              return Math.max(0, (item.value ?? 0) - includedQuantity);
            };
            const outboundPieces = additionals.outbound.reduce((total, item) => total + getChargeable(item), 0);
            const inboundPieces = additionals.inbound.reduce((total, item) => total + getChargeable(item), 0);
            return { outbound: outboundPieces, inbound: inboundPieces };
          };
          const getDirectionalCounts = (additionals: {outbound: FlightAdditionalServiceItem[], inbound:FlightAdditionalServiceItem[]})=>{
            const outbound = additionals.outbound.reduce((acc, item) => acc + ((item.value ?? 0) > 0 ? 1 : 0), 0);
            const inbound = additionals.inbound.reduce((acc, item) => acc + ((item.value ?? 0) > 0 ? 1 : 0), 0);
            return { outbound, inbound };
          };
          const getBaggageAmount = (items:FlightAdditionalServiceItem[], durationFactor:number) =>
            items.reduce((total, item) => {
              const isDuffel = item.metadata?.['provider'] === 'DUFFEL';
              const unitPrice = item.unitPrice || ExtrasPrices.baggage;
              return total + ((item.value ?? 0) * unitPrice * (isDuffel ? 1 : durationFactor));
            }, 0);
          
          const insuranceActives = getActives(aditional.insurance!);
          const flexpassActives = getActives(aditional.flexpass!);
          const carryonActives = getPieces(aditional.carryOn!);
          const baggageActives = getPieces(aditional.baggage!);
          if(insuranceActives>0){
            const insuranceCounts = getDirectionalCounts(aditional.insurance!);
            this.aditionalServiceCharges.push({
              description: 'Allianz Travel Premium',
              amount: Math.round(
                ExtrasPrices.insurance * (
                  insuranceCounts.outbound * outboundSegmentCount +
                  insuranceCounts.inbound * inboundSegmentCount
                )
              )
            });
          }
          if(flexpassActives>0){
            const flexpassCounts = getDirectionalCounts(aditional.flexpass!);
            this.aditionalServiceCharges.push({
              description: 'FlexPass',
              amount: Math.round(
                ExtrasPrices.flexpass * (
                  flexpassCounts.outbound * outboundSegmentCount +
                  flexpassCounts.inbound * inboundSegmentCount
                )
              )
            });
          }
          if(carryonActives>0){
            const carryonPieces = getChargeableCarryOnPieces(aditional.carryOn!);
            const carryOnAmount = Math.round(
              ExtrasPrices.carryon * (
                  carryonPieces.outbound * outboundDurationFactor +
                  carryonPieces.inbound * inboundDurationFactor
              )
            );
            if (carryOnAmount > 0) {
              this.aditionalServiceCharges.push({
                description: 'Equipaje de mano',
                amount: carryOnAmount
              });
            }
          }
          if(baggageActives>0){
            this.aditionalServiceCharges.push({
              description: 'Equipaje documentado',
              amount: Math.round(
                getBaggageAmount(aditional.baggage!.outbound, outboundDurationFactor) +
                getBaggageAmount(aditional.baggage!.inbound, inboundDurationFactor)
              )
            });
          }
        }
        const seatCharge = this.selectedSeatsCharge(booking);
        if (seatCharge) {
          this.aditionalServiceCharges.push(seatCharge);
        }
        this.updatePrice(booking);
        if(this.outboundAirlineCode){
          const airlineName = booking.flightDetails.flights.outbound?.dictionaries.carriers[this.outboundAirlineCode];
          if (airlineName) {
            this.brandfetch.getBrands(airlineName).subscribe(brands=>{
              this.outboundAirlineBrand = brands[0].domain;
            })
          }
        }
        if(this.inboundAirlineCode){
          const airlineName = booking.flightDetails.flights.inbound?.dictionaries.carriers[this.inboundAirlineCode];
          if (airlineName) {
            this.brandfetch.getBrands(airlineName).subscribe(brands=>{
              this.inboundAirlineBrand = brands[0].domain
            });
          }
        }
      }
    });
    this.bookingHandler.promo.subscribe(promo=>{
      this.appliedPromo = promo;
      if(this.booking!==undefined){
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
  private segmentDurationHours(duration: string | undefined): number {
    if (!duration) return 0;
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
    if (!match) return 0;
    const hours = match[1] ? Number(match[1]) : 0;
    const minutes = match[2] ? Number(match[2]) : 0;
    return hours + minutes / 60;
  }
  private segmentDurationFactor(segments: { duration: string }[]): number {
    if (!segments || segments.length === 0) return 0;
    return segments.reduce((acc, seg) => {
      const hours = this.segmentDurationHours(seg.duration);
      const multiplier = hours > 6 ? 2 : 1;
      return acc + multiplier;
    }, 0);
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
  private toAmount(amount:number|string|undefined):number {
    const parsed = typeof amount === 'number' ? amount : Number(amount ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  private flightAmount(offer:FlightOffer, amount:number|string):number{
    const value = this.toAmount(amount);
    // Duffel returns one aggregate amount for every passenger in the offer.
    return offer.source === 'DUFFEL'
      ? value
      : value * this.chargeablePassengers;
  }
  private selectedSeatsCharge(booking:FlightFirebaseBooking):Charge|undefined {
    let amount = 0;
    let selectedCount = 0;
    const processedServices = new Set<string>();
    for (const seatMap of booking.flightDetails.seatMaps ?? []) {
      for (const selection of seatMap.selectedSeats ?? []) {
        if (!selection.seat) continue;
        const pricing = selection.seat.travelerPricing.find(item =>
          item.travelerId === selection.travelerId
        ) ?? selection.seat.travelerPricing.find(item =>
          item.travelerId === 'all'
        );
        const serviceId = selection.serviceId || pricing?.serviceId;
        const uniqueKey = serviceId ||
          `${seatMap.id}:${selection.passengerID}:${selection.seat.number}`;
        if (processedServices.has(uniqueKey)) continue;
        processedServices.add(uniqueKey);
        const seatPrice = this.toAmount(pricing?.price?.total);
        if (seatPrice <= 0) continue;
        amount += seatPrice;
        selectedCount++;
      }
    }
    if (amount <= 0) return undefined;
    return {
      description: `Asientos seleccionados (${selectedCount})`,
      amount: Math.round(amount),
      currency: 'MXN'
    };
  }
  applyPromo(ammount:number, discount:number, type: 'percentage' | 'fixed'):number[]{
    const discountedAmmount:number = type==='fixed'?discount:(ammount*(discount/100))
    return [Math.round(ammount-discountedAmmount), Math.round(discountedAmmount)];
  }
  bookingTotalCalculator(booking:FlightFirebaseBooking):number{
    const outboundOffer = booking.flightDetails.flights!.outbound!.offer;
    let flightTotal:number = this.flightAmount(
      outboundOffer,
      outboundOffer.price.grandTotal
    );
    let discounted = 0;
    if(booking.flightDetails.round&&booking.flightDetails.flights!.inbound){
      const inboundOffer = booking.flightDetails.flights!.inbound.offer;
      flightTotal += this.flightAmount(
        inboundOffer,
        inboundOffer.price.grandTotal
      );
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
        console.log(promo)
        if(promo){
          this.promoControl.setValue(promo.code);
          this._sb.open('Promoción '+promo.code+' aplicada.', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(promo);
          this.updatePrice(this.booking!);
        }else{
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

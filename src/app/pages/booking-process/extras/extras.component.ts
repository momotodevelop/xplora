import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DepartureArrival, FlightOffer } from '../../../types/flight-offer-amadeus.types';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import * as _ from 'lodash';
import { AddCarryOnComponent } from './add-carry-on/add-carry-on.component';
import { AddFlexPassComponent } from './add-flex-pass/add-flex-pass.component';
import { AddPremiumInsuranceComponent } from './add-insurance/add-insurance.component';
import { AddBaggageComponent } from './add-baggage/add-baggage.component';
import { CommonModule } from '@angular/common';
import { XploraApiService } from '../../../services/xplora-api.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowUp, faBolt, faChair, faChevronRight, faCrown, faExchangeAlt, faFloppyDisk, faMapMarkerAlt, faPlusCircle, faRulerCombined, faShieldAlt, faSpinner, faSuitcase, faSuitcaseRolling, faSync, faTag, faWallet, faWeightHanging, faWineBottle } from '@fortawesome/free-solid-svg-icons';
import { FlightAdditionalServiceItem, FlightAdditionalServices, FlightFirebaseBooking } from '../../../types/booking.types';
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
  price: number,
  outboundSegmentCount: number,
  inboundSegmentCount: number,
  outboundDurationFactor: number,
  inboundDurationFactor: number
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
  insuranceShieldIcon=faShieldAlt;
  carryOnIcon=faSuitcase;
  carryOnWeightIcon=faWeightHanging;
  carryOnSizeIcon=faRulerCombined;
  carryOnDealIcon=faTag;
  baggageWeightIcon=faWeightHanging;
  baggageSizeIcon=faRulerCombined;
  baggageCarryIcon=faSuitcaseRolling;
  baggageDealIcon=faTag;
  flexpassExchangeIcon=faExchangeAlt;
  flexpassFastIcon=faBolt;
  flexpassSeatIcon=faChair;
  flexpassCreditIcon=faWallet;
  premiumIcon=faCrown;
  loading:boolean=false;
  additionalServices?:FlightAdditionalServices;
  private initializingAdditionalServices = false;
  ngOnInit(){
    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.booking = booking;
        if(booking.flightDetails.aditionalServices){
          this.isUpdate=true;
          const aditionalServices = booking.flightDetails.aditionalServices;
          this.additionalServices = aditionalServices;
          this.updateExtrasTotal();
        } else {
          this.ensureAdditionalServices();
          this.updateExtrasTotal();
        }
      }
    });
  }
  private buildServiceItems(type: "INSURANCE"|"FLEXPASS"|"CARRYON"|"BAGGAGE", unitPrice:number) {
    const passengers = this.booking?.flightDetails?.passengers.details?.filter(passenger => passenger.type !== "INFANT") ?? [];
    const buildItems = (scope: "OUTBOUND"|"INBOUND") => passengers.map(passenger => {
      const isCarryOn = type === "CARRYON";
      return {
        scope,
        targetID: passenger.id,
        context: 'FLIGHT' as const,
        type,
        unitPrice,
        active: isCarryOn,
        value: isCarryOn ? 1 : 0
      };
    });
    return {
      outbound: buildItems("OUTBOUND"),
      inbound: this.booking?.flightDetails?.round ? buildItems("INBOUND") : []
    };
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
  private segmentCount(segments: { duration: string }[]): number {
    return segments?.length || 0;
  }
  private ensureAdditionalServices() {
    if (!this.booking?.flightDetails?.passengers.details) return;
    if (this.additionalServices) return;
    if (this.initializingAdditionalServices) return;
    this.initializingAdditionalServices = true;
    this.additionalServices = {
      insurance: this.buildServiceItems("INSURANCE", ExtrasPrices.insurance),
      flexpass: this.buildServiceItems("FLEXPASS", ExtrasPrices.flexpass),
      carryOn: this.buildServiceItems("CARRYON", ExtrasPrices.carryon),
      baggage: this.buildServiceItems("BAGGAGE", ExtrasPrices.baggage)
    };
    const bookingUpdate: FlightFirebaseBooking = {
      ...this.booking!,
      flightDetails: {
        ...this.booking!.flightDetails,
        aditionalServices: this.additionalServices
      }
    };
    this.booking = bookingUpdate;
    this.bookingHandler.setBookingInfo(bookingUpdate);
    this.fireBooking.nestedUpdateBooking(this.booking!.bookingID!, {
      "flightDetails.aditionalServices": this.additionalServices
    }).then(ok=>{
      this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
      this.initializingAdditionalServices = false;
    }).catch(()=>{
      this.initializingAdditionalServices = false;
    });
  }
  private ensureCarryOnMinimum() {
    if (!this.additionalServices?.carryOn) return;
    const normalize = (items: FlightAdditionalServiceItem[]) => {
      items.forEach(item => {
        if ((item.value ?? 0) < 1) {
          item.value = 1;
        }
        item.active = true;
      });
    };
    normalize(this.additionalServices.carryOn.outbound);
    normalize(this.additionalServices.carryOn.inbound);
  }
  private syncAdditionalService(
    key: "insurance" | "flexpass" | "carryOn" | "baggage",
    value: ExtraServiceData
  ) {
    if (!this.booking || !this.additionalServices) return;
    this.additionalServices = {
      ...this.additionalServices,
      [key]: value
    };
    const bookingUpdate: FlightFirebaseBooking = {
      ...this.booking,
      flightDetails: {
        ...this.booking.flightDetails,
        aditionalServices: this.additionalServices
      }
    };
    this.booking = bookingUpdate;
    this.bookingHandler.setBookingInfo(bookingUpdate);
    this.fireBooking.nestedUpdateBooking(this.booking.bookingID!, {
      [`flightDetails.aditionalServices.${key}`]: value
    }).then(ok=>{
      this.bookingHandler.setBookingInfo(ok as FlightFirebaseBooking);
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
    this.ensureAdditionalServices();
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const outboundSegments = this.booking!.flightDetails.flights!.outbound!.offer.itineraries?.[0]?.segments ?? [];
    const inboundSegments = this.booking!.flightDetails.round && this.booking!.flightDetails.flights!.inbound
      ? this.booking!.flightDetails.flights!.inbound!.offer.itineraries?.[0]?.segments ?? []
      : [];
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
      price: ExtrasPrices.insurance,
      outboundSegmentCount: this.segmentCount(outboundSegments) || 1,
      inboundSegmentCount: this.segmentCount(inboundSegments),
      outboundDurationFactor: this.segmentDurationFactor(outboundSegments) || 1,
      inboundDurationFactor: this.segmentDurationFactor(inboundSegments)
    }
    this.dialog.open(AddPremiumInsuranceComponent, {panelClass: 'custom-bottom-sheet-full-height', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.syncAdditionalService("insurance", value);
        this.updateExtrasTotal();
      }
    })
  }
  openFlexPass(){
    this.ensureAdditionalServices();
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const outboundSegments = this.booking!.flightDetails.flights!.outbound!.offer.itineraries?.[0]?.segments ?? [];
    const inboundSegments = this.booking!.flightDetails.round && this.booking!.flightDetails.flights!.inbound
      ? this.booking!.flightDetails.flights!.inbound!.offer.itineraries?.[0]?.segments ?? []
      : [];
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
      price: ExtrasPrices.flexpass,
      outboundSegmentCount: this.segmentCount(outboundSegments) || 1,
      inboundSegmentCount: this.segmentCount(inboundSegments),
      outboundDurationFactor: this.segmentDurationFactor(outboundSegments) || 1,
      inboundDurationFactor: this.segmentDurationFactor(inboundSegments)
    }
    this.dialog.open(AddFlexPassComponent, {panelClass: 'custom-bottom-sheet-full-height', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.syncAdditionalService("flexpass", value);
        this.updateExtrasTotal();
      }
    })
  }
  openCarryOn(){
    this.ensureAdditionalServices();
    this.ensureCarryOnMinimum();
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const outboundSegments = this.booking!.flightDetails.flights!.outbound!.offer.itineraries?.[0]?.segments ?? [];
    const inboundSegments = this.booking!.flightDetails.round && this.booking!.flightDetails.flights!.inbound
      ? this.booking!.flightDetails.flights!.inbound!.offer.itineraries?.[0]?.segments ?? []
      : [];
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
      price: ExtrasPrices.carryon,
      outboundSegmentCount: this.segmentCount(outboundSegments) || 1,
      inboundSegmentCount: this.segmentCount(inboundSegments),
      outboundDurationFactor: this.segmentDurationFactor(outboundSegments) || 1,
      inboundDurationFactor: this.segmentDurationFactor(inboundSegments)
    }
    this.dialog.open(AddCarryOnComponent, {panelClass: 'custom-bottom-sheet-full-height', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.syncAdditionalService("carryOn", value);
        this.updateExtrasTotal();
      }
    })
  }
  openBaggage(){
    this.ensureAdditionalServices();
    const flights:FlightOffer[] = [this.booking!.flightDetails.flights!.outbound!.offer]
    if(this.booking!.flightDetails.round){
      flights.push(this.booking!.flightDetails.flights!.inbound!.offer)
    }
    const outboundSegments = this.booking!.flightDetails.flights!.outbound!.offer.itineraries?.[0]?.segments ?? [];
    const inboundSegments = this.booking!.flightDetails.round && this.booking!.flightDetails.flights!.inbound
      ? this.booking!.flightDetails.flights!.inbound!.offer.itineraries?.[0]?.segments ?? []
      : [];
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
      price: ExtrasPrices.baggage,
      outboundSegmentCount: this.segmentCount(outboundSegments) || 1,
      inboundSegmentCount: this.segmentCount(inboundSegments),
      outboundDurationFactor: this.segmentDurationFactor(outboundSegments) || 1,
      inboundDurationFactor: this.segmentDurationFactor(inboundSegments)
    }
    this.dialog.open(AddBaggageComponent, {panelClass: 'custom-bottom-sheet-full-height', data}).afterDismissed().subscribe(value=>{
      if(value!==undefined){
        this.syncAdditionalService("baggage", value);
        this.updateExtrasTotal();
      }
    })
  }
  updateExtrasTotal() {
    let total = 0;

    const aditional = this.additionalServices;
    if (!aditional || !this.booking?.flightDetails?.flights?.outbound?.offer) return;

    const outboundOffer = this.booking.flightDetails.flights.outbound.offer;
    const inboundOffer = this.booking.flightDetails.round && this.booking.flightDetails.flights.inbound
      ? this.booking.flightDetails.flights.inbound.offer
      : undefined;

    const outboundSegments = outboundOffer.itineraries?.[0]?.segments ?? [];
    const inboundSegments = inboundOffer?.itineraries?.[0]?.segments ?? [];

    const outboundSegmentCount = outboundSegments.length || 1;
    const inboundSegmentCount = inboundSegments.length || 0;

    const outboundDurationFactor = this.segmentDurationFactor(outboundSegments);
    const inboundDurationFactor = this.segmentDurationFactor(inboundSegments);

    const sumValues = (items?: FlightAdditionalServiceItem[]) =>
      items?.reduce((acc, item) => acc + (item.value ?? 0), 0) || 0;
    const sumChargeableCarryOn = (items?: FlightAdditionalServiceItem[]) =>
      items?.reduce((acc, item) => acc + Math.max(0, (item.value ?? 0) - 1), 0) || 0;

    // Seguro (por segmento)
    const insuranceTotal =
      sumValues(aditional.insurance!.outbound) * ExtrasPrices.insurance * outboundSegmentCount +
      sumValues(aditional.insurance!.inbound) * ExtrasPrices.insurance * inboundSegmentCount;
    this.insuranceTotal = insuranceTotal;
    total += insuranceTotal;

    // Flexpass (por segmento)
    const flexpassTotal =
      sumValues(aditional.flexpass!.outbound) * ExtrasPrices.flexpass * outboundSegmentCount +
      sumValues(aditional.flexpass!.inbound) * ExtrasPrices.flexpass * inboundSegmentCount;
    this.flexpassTotal = flexpassTotal;
    total += flexpassTotal;

    // Equipaje de mano (por duración de segmento)
    const carryOnTotal =
      sumChargeableCarryOn(aditional.carryOn!.outbound) * ExtrasPrices.carryon * outboundDurationFactor +
      sumChargeableCarryOn(aditional.carryOn!.inbound) * ExtrasPrices.carryon * inboundDurationFactor;
    this.carryOnTotal = carryOnTotal;
    total += carryOnTotal;

    // Equipaje documentado (por duración de segmento)
    const baggageTotal =
      sumValues(aditional.baggage!.outbound) * ExtrasPrices.baggage * outboundDurationFactor +
      sumValues(aditional.baggage!.inbound) * ExtrasPrices.baggage * inboundDurationFactor;
    this.baggageTotal = baggageTotal;
    total += baggageTotal;

    this.total = total;
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

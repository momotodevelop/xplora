import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DepartureArrival, FlightChangeCondition, FlightOffer } from '../../../types/flight-offer-amadeus.types';
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
import { DuffelAncillariesService, DuffelBaggageService, DuffelOfferAncillaryInfo } from '../../../services/duffel-ancillaries.service';

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

interface DuffelServiceNotice {
  tone: 'success'|'warning'|'info';
  text: string;
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
    private fireBooking: FireBookingService,
    private duffelAncillaries: DuffelAncillariesService
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
  duffelAncillaryInfo:Record<string, DuffelOfferAncillaryInfo>={};
  private initializingAdditionalServices = false;
  private loadingDuffelBaggage = false;
  private requestedDuffelOfferKey?:string;
  ngOnInit(){
    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.booking = booking;
        if(booking.flightDetails.aditionalServices){
          this.isUpdate=true;
          const aditionalServices = booking.flightDetails.aditionalServices;
          this.additionalServices = aditionalServices;
          this.hydrateCarryOnAllowances();
          this.loadDuffelAncillaryInfo();
          this.updateExtrasTotal();
        } else {
          this.ensureAdditionalServices();
          this.loadDuffelAncillaryInfo();
          this.updateExtrasTotal();
        }
      }
    });
  }
  private buildServiceItems(type: "INSURANCE"|"FLEXPASS"|"CARRYON"|"BAGGAGE", unitPrice:number) {
    const passengers = (this.booking?.flightDetails?.passengers.details ?? [])
      .map((passenger, travelerIndex) => ({passenger, travelerIndex}))
      .filter(({passenger}) => passenger.type !== "INFANT");
    const buildItems = (scope: "OUTBOUND"|"INBOUND") => passengers.map(({passenger, travelerIndex}) => {
      const isCarryOn = type === "CARRYON";
      const offer = scope === 'OUTBOUND'
        ? this.booking?.flightDetails?.flights.outbound?.offer
        : this.booking?.flightDetails?.flights.inbound?.offer;
      const includedQuantity = isCarryOn
        ? Math.max(1, this.getIncludedBaggageQuantity(offer, travelerIndex, 'carry_on'))
        : 0;
      const item = {
        scope,
        targetID: passenger.id,
        context: 'FLIGHT' as const,
        type,
        unitPrice,
        active: isCarryOn && includedQuantity > 0,
        value: isCarryOn ? includedQuantity : 0
      };
      return isCarryOn ? {
        ...item,
        metadata: {
          provider: 'DUFFEL',
          includedQuantity
        }
      } : item;
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
        const includedQuantity = Number(item.metadata?.['includedQuantity'] ?? 0);
        if ((item.value ?? 0) < includedQuantity) {
          item.value = includedQuantity;
        }
        item.active = (item.value ?? 0) > 0;
      });
    };
    normalize(this.additionalServices.carryOn.outbound);
    normalize(this.additionalServices.carryOn.inbound);
  }
  private loadDuffelAncillaryInfo() {
    if (!this.booking?.flightDetails?.flights?.outbound?.offer || !this.additionalServices?.baggage) return;
    if (this.loadingDuffelBaggage) return;
    const offers:FlightOffer[] = [this.booking.flightDetails.flights.outbound.offer];
    if (this.booking.flightDetails.round && this.booking.flightDetails.flights.inbound?.offer) {
      offers.push(this.booking.flightDetails.flights.inbound.offer);
    }
    const offerKey = offers.map(offer => offer.id).sort().join('|');
    if (this.requestedDuffelOfferKey === offerKey) return;
    this.requestedDuffelOfferKey = offerKey;
    this.loadingDuffelBaggage = true;
    this.duffelAncillaries.getOfferAncillaryInfo(offers).subscribe({
      next: infoByOffer => {
        this.duffelAncillaryInfo = infoByOffer;
        const outbound = this.applyDuffelBaggageServices(
          this.additionalServices!.baggage!.outbound,
          this.booking!.flightDetails.flights.outbound!.offer,
          infoByOffer[this.booking!.flightDetails.flights.outbound!.offer.id]?.baggageServices || []
        );
        const inboundOffer = this.booking!.flightDetails.flights.inbound?.offer;
        const inbound = inboundOffer
          ? this.applyDuffelBaggageServices(
            this.additionalServices!.baggage!.inbound,
            inboundOffer,
            infoByOffer[inboundOffer.id]?.baggageServices || []
          )
          : [];
        const baggage = {outbound, inbound};
        const matchedService = [...outbound, ...inbound].some(item => item.metadata?.['provider'] === 'DUFFEL' && item.metadata?.['serviceId']);
        if (matchedService && !_.isEqual(baggage, this.additionalServices!.baggage)) {
          this.syncAdditionalService('baggage', baggage);
        }
        this.updateExtrasTotal();
        this.loadingDuffelBaggage = false;
      },
      error: () => {
        this.loadingDuffelBaggage = false;
      }
    });
  }
  private applyDuffelBaggageServices(
    items: FlightAdditionalServiceItem[],
    offer: FlightOffer,
    services: DuffelBaggageService[]
  ): FlightAdditionalServiceItem[] {
    if (!services.length) return items;
    const segmentIds = new Set(offer.itineraries.flatMap(itinerary => itinerary.segments.map(segment => segment.id)));
    return items.map((item, index) => {
      const travelerIndex = this.getTravelerIndex(item, index);
      const travelerId = offer.travelerPricings?.[travelerIndex]?.travelerId;
      const service = this.findDuffelBaggageService(
        services.filter(candidate => candidate.total_currency === offer.price.currency),
        travelerId,
        segmentIds
      );
      if (!service) return item;
      return {
        ...item,
        unitPrice: Number(service.total_amount),
        metadata: {
          ...(item.metadata || {}),
          provider: 'DUFFEL',
          offerId: offer.id,
          serviceId: service.id,
          passengerIds: service.passenger_ids || (travelerId ? [travelerId] : []),
          segmentIds: service.segment_ids || Array.from(segmentIds),
          currency: service.total_currency,
          maximumQuantity: service.maximum_quantity ?? 1,
          serviceMetadata: service.metadata || {}
        }
      };
    });
  }
  private findDuffelBaggageService(
    services: DuffelBaggageService[],
    travelerId: string | undefined,
    segmentIds: Set<string>
  ): DuffelBaggageService | undefined {
    const matching = services.filter(service => {
      const passengerMatch = !travelerId || !service.passenger_ids?.length || service.passenger_ids.includes(travelerId);
      const segmentMatch = !service.segment_ids?.length || Array.from(segmentIds).every(segmentId =>
        service.segment_ids?.includes(segmentId)
      );
      return passengerMatch && segmentMatch;
    });
    return matching.sort((a, b) => Number(a.total_amount) - Number(b.total_amount))[0];
  }
  private getTravelerIndex(item:FlightAdditionalServiceItem, fallbackIndex:number):number {
    const passengerIndex = this.booking?.flightDetails.passengers.details?.findIndex(passenger =>
      String(passenger.id) === String(item.targetID)
    ) ?? -1;
    return passengerIndex >= 0 ? passengerIndex : fallbackIndex;
  }
  private getIncludedBaggageQuantity(
    offer:FlightOffer|undefined,
    travelerIndex:number,
    type:'carry_on'|'checked'
  ):number {
    const fareDetails = offer?.travelerPricings?.[travelerIndex]?.fareDetailsBySegment ?? [];
    if (!fareDetails.length) return 0;
    const quantities = fareDetails.map(detail =>
      type === 'carry_on'
        ? detail.includedCabinBags?.quantity ?? 0
        : detail.includedCheckedBags?.quantity ?? 0
    );
    return Math.min(...quantities);
  }
  private hydrateCarryOnAllowances():void {
    const carryOn = this.additionalServices?.carryOn;
    if (!carryOn || !this.booking) return;
    const enrichItems = (
      items:FlightAdditionalServiceItem[],
      offer:FlightOffer|undefined
    ) => items.map((item, index) => {
      const includedQuantity = this.getIncludedBaggageQuantity(
        offer,
        this.getTravelerIndex(item, index),
        'carry_on'
      );
      const previousIncluded = item.metadata?.['includedQuantity'];
      const assumedPreviousIncluded = previousIncluded === undefined
        ? Math.min(1, item.value ?? 0)
        : Number(previousIncluded);
      const selectedExtras = Math.max(0, (item.value ?? 0) - assumedPreviousIncluded);
      const xploraIncludedQuantity = Math.max(1, includedQuantity);
      const value = xploraIncludedQuantity + selectedExtras;
      return {
        ...item,
        value,
        active: value > 0,
        metadata: {
          ...(item.metadata || {}),
          provider: 'DUFFEL',
          includedQuantity: xploraIncludedQuantity
        }
      };
    });
    const hydrated:ExtraServiceData = {
      outbound: enrichItems(carryOn.outbound, this.booking.flightDetails.flights.outbound?.offer),
      inbound: enrichItems(carryOn.inbound, this.booking.flightDetails.flights.inbound?.offer)
    };
    if (!_.isEqual(carryOn, hydrated)) {
      this.syncAdditionalService('carryOn', hydrated);
    }
  }
  get carryOnAllowanceNotice():DuffelServiceNotice|undefined {
    const quantities = this.getOfferAllowanceQuantities('carry_on');
    if (!quantities.length) return undefined;
    const min = Math.min(...quantities);
    const max = Math.max(...quantities);
    if (max < 1) {
      return {tone: 'info', text: 'Duffel no reporta equipaje de mano incluido en esta tarifa.'};
    }
    const quantityText = min === max ? `${min}` : `${min}–${max}`;
    return {
      tone: 'success',
      text: `La tarifa incluye ${quantityText} pieza${max === 1 ? '' : 's'} de mano por pasajero.`
    };
  }
  get checkedBaggageAllowanceNotice():DuffelServiceNotice|undefined {
    const quantities = this.getOfferAllowanceQuantities('checked');
    if (!quantities.length) return undefined;
    const min = Math.min(...quantities);
    const max = Math.max(...quantities);
    if (max < 1) return undefined;
    const quantityText = min === max ? `${min}` : `${min}–${max}`;
    return {
      tone: 'success',
      text: `Duffel reporta ${quantityText} pieza${max === 1 ? '' : 's'} documentada${max === 1 ? '' : 's'} incluida${max === 1 ? '' : 's'} por pasajero.`
    };
  }
  get baggagePriceNotice():DuffelServiceNotice|undefined {
    const services = Object.values(this.duffelAncillaryInfo).flatMap(info => info.baggageServices);
    if (!services.length) return undefined;
    const cheapest = [...services].sort((a, b) => Number(a.total_amount) - Number(b.total_amount))[0];
    return {
      tone: 'info',
      text: `Precio de aerolínea disponible desde ${this.formatMoney(Number(cheapest.total_amount), cheapest.total_currency)} por pieza.`
    };
  }
  get changeConditionNotice():DuffelServiceNotice|undefined {
    const offers = this.getSelectedOffers();
    const conditions = offers.map(offer => {
      const latest = this.duffelAncillaryInfo[offer.id]?.changeCondition;
      return latest !== undefined ? latest : offer.conditions?.changeBeforeDeparture;
    }).filter((condition): condition is FlightChangeCondition => condition !== undefined && condition !== null);
    if (!conditions.length) return undefined;
    if (conditions.some(condition => !condition.allowed)) {
      return {
        tone: 'warning',
        text: 'La tarifa de la aerolínea no permite cambios voluntarios en al menos uno de los trayectos.'
      };
    }
    const knownPenalties = conditions.filter(condition =>
      condition.penaltyAmount !== undefined && condition.penaltyAmount !== null
    );
    if (knownPenalties.length === conditions.length && knownPenalties.every(condition => Number(condition.penaltyAmount) === 0)) {
      return {
        tone: 'success',
        text: 'La aerolínea permite cambios sin penalización; puede aplicar diferencia de tarifa.'
      };
    }
    const positivePenalties = knownPenalties.filter(condition => Number(condition.penaltyAmount) > 0);
    if (positivePenalties.length) {
      const cheapest = [...positivePenalties].sort((a, b) =>
        Number(a.penaltyAmount) - Number(b.penaltyAmount)
      )[0];
      return {
        tone: 'warning',
        text: `La aerolínea reporta una penalización desde ${this.formatMoney(Number(cheapest.penaltyAmount), cheapest.penaltyCurrency || 'MXN')}, más diferencia de tarifa.`
      };
    }
    return {
      tone: 'info',
      text: 'La aerolínea permite cambios, pero Duffel no informa el importe de la penalización.'
    };
  }
  private getSelectedOffers():FlightOffer[] {
    const outbound = this.booking?.flightDetails.flights.outbound?.offer;
    const inbound = this.booking?.flightDetails.flights.inbound?.offer;
    return [outbound, inbound].filter((offer): offer is FlightOffer => Boolean(offer));
  }
  private getOfferAllowanceQuantities(type:'carry_on'|'checked'):number[] {
    return this.getSelectedOffers().flatMap(offer =>
      (offer.travelerPricings || [])
        .filter(traveler => traveler.travelerType !== 'INFANT_WITHOUT_SEAT')
        .map((_, travelerIndex) => this.getIncludedBaggageQuantity(offer, travelerIndex, type))
    );
  }
  private formatMoney(amount:number, currency:string):string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency
    }).format(amount);
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
      items?.reduce((acc, item) => {
        const includedQuantity = Number(item.metadata?.['includedQuantity'] ?? 0);
        return acc + Math.max(0, (item.value ?? 0) - includedQuantity);
      }, 0) || 0;

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
      this.sumBaggageTotal(aditional.baggage!.outbound, outboundDurationFactor) +
      this.sumBaggageTotal(aditional.baggage!.inbound, inboundDurationFactor);
    this.baggageTotal = baggageTotal;
    total += baggageTotal;

    this.total = total;
  }  
  private sumBaggageTotal(items: FlightAdditionalServiceItem[] | undefined, durationFactor: number): number {
    return items?.reduce((acc, item) => {
      const quantity = item.value ?? 0;
      const isDuffel = item.metadata?.['provider'] === 'DUFFEL';
      const unitPrice = item.unitPrice || ExtrasPrices.baggage;
      return acc + (quantity * unitPrice * (isDuffel ? 1 : durationFactor));
    }, 0) || 0;
  }
  saveExtras(){
    const aditionalServices = {
      insurance: this.insuranceActive,
      flexpass: this.flexpass,
      carryOn: this.carryOn,
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

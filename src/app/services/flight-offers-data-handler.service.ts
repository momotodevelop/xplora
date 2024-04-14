import { Injectable } from '@angular/core';
import { Dictionaries, FlightOffer, Segment } from '../types/flight-offer-amadeus.types';
import { BehaviorSubject } from 'rxjs';
import * as moment from 'moment';
import * as _ from 'lodash';
import { FilterFormValue } from '../pages/flight-search/sidebar/sidebar.component';
export interface FilterOptions{
  segments?: number[],
  airlines?: string[],
  departureTime?: "MORNING"|"AFTERNOON"|"EVENING",
  arrivalTime?: "MORNING"|"AFTERNOON"|"EVENING",
  price?: {
    min: number,
    max: number
  }
}
export interface SelectedFlights{
  outbound?: {
    offer: FlightOffer,
    dictionaries: Dictionaries
  };
  inbound?: {
    offer: FlightOffer,
    dictionaries: Dictionaries
  };
}
export type SortOptions = ['duracion' | 'precio' | 'salida' | 'llegada', 'asc' | 'desc']
export interface CarrierOption{
  id:string;
  value: string;
}
@Injectable({
  providedIn: 'root'
})
export class FlightOffersDataHandlerService {
  dictionaries!:Dictionaries;
  private _carriers = new BehaviorSubject<CarrierOption[]>([]);
  private _filtered = new BehaviorSubject<FlightOffer[]>([]);
  private _unfiltered = new BehaviorSubject<FlightOffer[]>([]);
  private _filters = new BehaviorSubject<FilterOptions|undefined>(undefined);
  private _sorting = new BehaviorSubject<SortOptions|undefined>(undefined);
  private _filterFormValue = new BehaviorSubject<FilterFormValue|undefined>(undefined);
  private _page = new BehaviorSubject<number>(1);
  private _pageSize = new BehaviorSubject<number>(7);
  private _selected = new BehaviorSubject<SelectedFlights>({});
  private _flightSelectionStatus = new BehaviorSubject<"OUTBOUND"|"INBOUND"|"FULL">("OUTBOUND");
  filtered = this._filtered.asObservable();
  carriers = this._carriers.asObservable();
  unfiltered = this._unfiltered.asObservable();
  filters = this._filters.asObservable();
  sorting = this._sorting.asObservable();
  filterFormValue = this._filterFormValue.asObservable();
  page = this._page.asObservable();
  pageSize = this._pageSize.asObservable();
  selected = this._selected.asObservable();
  flightSelectionStatus = this._flightSelectionStatus.asObservable();
  constructor() { }

  setData(offers:FlightOffer[], dictionaries:Dictionaries, pageSize:number, filters?:FilterOptions, sorting?:SortOptions){
    this._unfiltered.next(offers);
    this.dictionaries=dictionaries;
    this._carriers.next(this.getCarrierOptions(this.dictionaries));
    this._filtered.next(filters?this.getFilterOffers(filters, sorting):this._unfiltered.value);
    this._pageSize.next(pageSize);
    this._page.next(1);
  }

  selectFlight(flight:FlightOffer, dictionaries:Dictionaries, inbound:boolean=false, round:boolean=false){
    if(!inbound){
      this._selected.next({
        outbound: {
          offer: flight,
          dictionaries: dictionaries
        },
        inbound: this._selected.value?.inbound ?? undefined
      });
    }else{
      this._selected.next({
        outbound: this._selected.value?.outbound ?? undefined,
        inbound: {
          offer: flight,
          dictionaries: dictionaries
        }
      });
    }
    this._flightSelectionStatus.next(this.determineFlightStatus(this._selected.value, round));
  }
  createBooking(bookingInfo:any){
    let flights:SelectedFlights=this._selected.value;
    let bookingData = {
      ...bookingInfo,
      flights
    }
    console.log(bookingData);
    return bookingData;
  }
  resetFlightSelection(){
    this._selected.next({});
    this._flightSelectionStatus.next("OUTBOUND");
  }


  filterOffers(filters:FilterOptions, sorting:SortOptions=["precio", "asc"]):void{
    this._filtered.next(this.getFilterOffers(filters, sorting));
    this._page.next(1);
    this.updateFilterValue(filters, sorting);
  }
  updateFilterValue(filters:FilterOptions, sorting:SortOptions=["precio", "asc"]){
    this._filters.next(filters);
    this._sorting.next(sorting);
  }

  updateFormValue(value:FilterFormValue){
    this._filterFormValue.next(value);
  }

  updatePage(page:number){
    this._page.next(page);
  }
  prevPage(){
    this._page.next(this._page.value-1);
  }
  nextPage(){
    this._page.next(this._page.value+1);
  }
  updatePageSize(size:number){
    this._pageSize.next(size);
  }

  getEstimatedResults(filters:FilterOptions, sorting:SortOptions){
    return this.getFilterOffers(filters, sorting).length
  }

  private getFilterOffers(filters: FilterOptions, sorting?:SortOptions): FlightOffer[]{
    let filtered = this._unfiltered.value;
    // Filtro por número de segmentos
    if (filters.segments && filters.segments.length > 0) {
      filtered = filtered.filter(offer =>
        filters.segments?.includes(offer.itineraries[0].segments.length)
      );
    }
    // Filtro por aerolíneas
    if (filters.airlines && filters.airlines.length > 0) {
      filtered = filtered.filter(offer =>
        offer.itineraries.some(itinerary =>
          itinerary.segments.some(segment =>
            (filters.airlines as string[]).includes(segment.carrierCode)
          )
        )
      );
    }
    // Filtro por horario de salida
    if (filters.departureTime) {
      console.log(filters.departureTime);
      filtered = this.filterByTime(filtered, filters.departureTime, true);
    }
    // Filtro por horario de llegada
    if (filters.arrivalTime) {
      filtered = this.filterByTime(filtered, filters.arrivalTime, false);
    }
    if (filters.price) {
      filtered = filtered.filter(offer => {
        const totalPrice = offer.price.total as number; // Asume que el precio total está directamente bajo la propiedad price
        return totalPrice >= filters.price!.min && totalPrice <= filters.price!.max;
      });
    }
    return sorting?this.sortOffers(filtered, sorting):filtered;
  }

  private filterByTime(offers: FlightOffer[], time: "MORNING" | "AFTERNOON" | "EVENING", isDeparture: boolean): FlightOffer[] {
    return offers.filter(offer => {
      const targetTime = isDeparture ? offer.itineraries[0].segments[0].departure.at : (_.last(offer.itineraries[0].segments) as Segment).arrival.at ;
      return this.timeMatches(targetTime, time);
    });
  }

  private sortOffers(offers: FlightOffer[], sortOptions: SortOptions): FlightOffer[] {
    return offers.sort((a, b) => {
      let comparison = 0;

      switch (sortOptions[0]) {
        case 'duracion':
          comparison = moment.duration(a.itineraries[0].duration).asSeconds() - moment.duration(b.itineraries[0].duration).asSeconds();
          break;
        case 'precio':
          comparison = (a.price.total as number) - (b.price.total as number);
          break;
        case 'salida':
          const departureA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
          const departureB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
          comparison = departureA - departureB;
          break;
        case 'llegada':
          const arrivalA = new Date(_.last(a.itineraries[0].segments)!.arrival.at).getTime();
          const arrivalB = new Date(_.last(b.itineraries[0].segments)!.arrival.at).getTime();
          comparison = arrivalA - arrivalB;
          break;
      }

      return sortOptions[1] === 'desc' ? comparison * -1 : comparison;
    });
  }

  private timeMatches(dateTime: string, timeSlot: "MORNING" | "AFTERNOON" | "EVENING"): boolean {
    const hour = new Date(dateTime).getHours();
    switch (timeSlot) {
      case "MORNING":
        return hour >= 5 && hour < 12;
      case "AFTERNOON":
        return hour >= 12 && hour < 18;
      case "EVENING":
        return hour >= 18 || hour < 5;
      default:
        return false;
    }
  }

  private determineFlightStatus(selectedFlights: SelectedFlights, round: boolean): 'OUTBOUND' | 'INBOUND' | 'FULL' {
    if (selectedFlights.outbound && selectedFlights.inbound) {
      return 'FULL'; // Ambos vuelos están definidos
    } else if (selectedFlights.outbound && !selectedFlights.inbound && !round) {
      return 'FULL'; // Solo vuelo de ida seleccionado y no es un viaje redondo
    } else if (selectedFlights.outbound && !selectedFlights.inbound && round) {
      return 'INBOUND'; // Solo vuelo de ida seleccionado y es un viaje redondo
    } else {
      return 'OUTBOUND'; // Vuelo de ida no seleccionado o ningún vuelo seleccionado aún
    }
  }

  getCarrierOptions(dictionary: Dictionaries): CarrierOption[] {
    const carrierEntries: CarrierOption[] = Object.keys(dictionary.carriers).map(key => {
      return {
        id: key,
        value: dictionary.carriers[key]
      };
    });
    
    return carrierEntries;
  }
}

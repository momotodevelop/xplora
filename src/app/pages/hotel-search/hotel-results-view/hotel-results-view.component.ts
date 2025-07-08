import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HotelResultComponent } from './hotel-result/hotel-result.component';
import { HotelResultsHeaderComponent } from './hotel-results-header/hotel-results-header.component';
import { HotelOffer } from '../../../types/amadeus-hotel-offers-response.types';
import { Hotel } from '../../../types/amadeus-hotels-response.types';
import { HotelListResultDisplay } from '../hotel-search.component';
import { HotelsListResponse } from '../../../types/lite-api.types';

@Component({
  selector: 'app-hotel-results-view',
  imports: [HotelResultComponent, HotelResultsHeaderComponent],
  templateUrl: './hotel-results-view.component.html',
  styleUrl: './hotel-results-view.component.scss'
})
export class HotelResultsViewComponent implements OnInit {
  @Input() destination!:google.maps.places.Place;
  @Input() rooms!:number[][];
  @Input() checkIn!:Date;
  @Input() checkOut!:Date;
  @Input() activeAmenitiesFilter!:string[];
  dN!:{ d: number, n: number };
  @Input() hotels!: HotelListResultDisplay[];
  @Input() hotelsList!:HotelsListResponse;
  ngOnInit(): void {
    this.dN = this.calcularDiasNoches(this.checkIn, this.checkOut);
    //console.log(this.hotelsList.total);
  }
  calcularDiasNoches(fechaInicio: Date, fechaFin: Date): { d: number, n: number } {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaTiempo = fin.getTime() - inicio.getTime();
    const noches = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24))
    const dias = noches + 1;
    return { d:dias, n:noches };
  }
}

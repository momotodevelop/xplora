import { Component, OnInit } from '@angular/core';
import { HotelSearchSidebarComponent } from './hotel-search-sidebar/hotel-search-sidebar.component';
import { HotelResultsViewComponent } from './hotel-results-view/hotel-results-view.component';
import { HotelResultComponent } from './hotel-results-view/hotel-result/hotel-result.component';
import { SharedDataService } from '../../services/shared-data.service';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, forkJoin, map } from 'rxjs';
import { GooglePlacesService } from '../../services/google-places.service';
import { AmadeusHotelsService } from '../../services/amadeus-hotels.service';
import { HotelOffer } from '../../types/amadeus-hotel-offers-response.types';
import { Hotel } from '../../types/amadeus-hotels-response.types';
import { CommonModule } from '@angular/common';
import { LiteApiService } from '../../services/lite-api.service';
import { HotelListResult, HotelMinRate, HotelsListResponse } from '../../types/lite-api.types';
export interface HotelSearchParams{
  placeId: string,
  rooms: string,
  checkin: string,
  checkout: string
}
export interface HotelListResultDisplay extends HotelListResult{
  rate?: number
}
@Component({
  selector: 'app-hotel-search',
  imports: [HotelSearchSidebarComponent, HotelResultsViewComponent, CommonModule],
  templateUrl: './hotel-search.component.html',
  styleUrl: './hotel-search.component.scss'
})
export class HotelSearchComponent implements OnInit {
  //offers?:HotelOffer[];
  //primaryInfo:Hotel[] = [];
  destination!:google.maps.places.Place;
  loading:boolean=false;
  loadingMore:boolean = false;
  checkIn!:Date;
  checkOut!:Date;
  rooms!:number[][];
  dN!: { d: number, n: number };
  activeAmenitiesFilters:string[]=[];
  activeHotelFilter?:string;
  
  dates!: string[];
  offset:number=0;
  limit:number=20;
  totalResults:number=0;
  hotelsResults:HotelListResultDisplay[]=[];
  hotelsList!:HotelsListResponse;
  constructor(
    private route: ActivatedRoute, 
    private sharedService: SharedDataService,
    private places: GooglePlacesService,
    private hotels: AmadeusHotelsService,
    private lite: LiteApiService
  ){}
  ngOnInit(): void {
    this.loading=true;
    this.sharedService.settBookingMode(true);
    this.sharedService.setLoading(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
      this.sharedService.setLoading(false);
    });
    combineLatest([this.route.params, this.route.queryParams, this.lite.facilitiesData]).subscribe(([p, q, facilities]) => {
      this.loading = true;
      this.hotelsResults = [];
      const params: HotelSearchParams = p as HotelSearchParams;
      console.log(facilities.data);
      this.lite.updateFacilities(facilities);
      const queryParams:{amenities?:string, hotel?:string} = q;
      if(queryParams.amenities){
        this.activeAmenitiesFilters = queryParams.amenities.split(",");
      }
      if(queryParams.hotel){
        this.activeHotelFilter=queryParams.hotel;
      }
      this.dates = [params.checkin, params.checkout];
      this.checkIn = new Date(params.checkin + "T00:00:00");
      this.checkOut = new Date(params.checkout + "T00:00:00");
      this.rooms = params.rooms.split('_').map(pair => pair.split(',').map(Number));
      this.places.getPlace(params.placeId, ["displayName", "location"]).then(place => {
        console.log(place.place.location);
        console.log(place.place.location?.lat());
        this.destination = place.place;
        this.loadHotels();

        /* this.hotels.getHotelList(place.place.location!.lat(), place.place.location!.lng(), 10, queryParams.amenities?.split(",") ?? []).subscribe(hotels => {
          let hotelList: string[] = hotels.data.map(hotel => hotel.hotelId);
          if(this.activeHotelFilter){
            hotelList = [this.activeHotelFilter];
          }
          this.primaryInfo = hotels.data;
          this.hotels.getHotelOffers(hotelList.slice(0, 50), params.checkin, params.checkout, 2, 1).subscribe(offers => {
            this.loading = false;
            if (offers.data.length > 0) {
              this.offers = offers.data.sort((a, b) =>
                a.available && !b.available ? -1 : !a.available && b.available ? 1 : 0
              );
            }
          });
        }); */
      });
    });
  }
  filterByAmenities(amenities:string[]){
    
  }
  loadHotels(distance:number=1000): void {
    const latitude:number = this.destination.location!.lat();
    const longitude: number = this.destination.location!.lng();
    const dates: string[] = this.dates;
    // Prevenir llamadas múltiples simultáneas
    //if (this.loading||this.loadingMore) return;
    this.lite.getHotels(
      longitude,
      latitude,
      distance,
      1.5,           // timeout
      this.offset,   // offset
      this.limit     // limit
    ).subscribe({
      next: (resp) => {
        console.log(resp);
        // `resp.data` es la lista de hoteles
        // `resp.total` indica cuántos hoteles hay en total
        this.totalResults = resp.total;
        this.hotelsList = resp;

        // IDs para tarifas mínimas
        const hotelIds = resp.hotelIds;

        // Ahora, traer las tarifas mínimas de estos hoteles
        this.lite.getMinRates(
            hotelIds,
            [{ adults: 2 }],   // Ejemplo de ocupación: 2 adultos
            dates, // checkin - checkout
            5                  // timeout
          )
          .subscribe({
            next: (ratesResp) => {
              const ratesData = ratesResp.data; 
              // ratesData es un array de objetos { hotelId, price, suggestedSellPrice }

              // Agregar las tarifas mínimas al arreglo de hoteles
              const hotelsWithRates:HotelListResultDisplay[] = resp.data.map(hotel => {
                const foundRate = ratesData.find(r => r.hotelId === hotel.id);
                let resultDisplay:HotelListResultDisplay = {
                  ...hotel,
                  rate: foundRate ? foundRate.price : undefined
                };
                return resultDisplay;
              });

              // Agregar al array total
              this.hotelsResults.push(...hotelsWithRates);

              // Si esta fue la primera carga, para la siguiente
              // pediremos 10 en lugar de 20

              if (this.offset === 0) {
                this.limit = 10;
              }

              // Actualizamos offset para la siguiente carga
              this.offset += resp.data.length;
              this.loading = false;
              this.loadingMore = false;
            },
            error: (err) => {
              console.error('Error obteniendo tarifas mínimas', err);
              this.loading = false;
            }
          });
      },
      error: (err) => {
        console.error('Error obteniendo hoteles', err);
        this.loading = false;
      }
    });
  }
  loadMore(){
    this.loadingMore = true;
    this.loadHotels();
  }
}

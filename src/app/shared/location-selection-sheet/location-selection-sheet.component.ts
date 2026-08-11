import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { AirportSearchService } from '../../services/airport-search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, forkJoin, map, of } from 'rxjs';
import {} from '@angular/common/http';
import { AmadeusLocation, AmadeusLocationResponseError } from '../../types/amadeus-airport-response.types';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { TitleCasePipe } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IataSubstitutionPipe } from '../../iata-substitution.pipe';
import { ORIGINS } from '../../static/featured-origins.static';
import { DirectDestination } from '../../types/amadeus-direct-airport-response.types';
import { GeolocationService } from '../../services/geolocation.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleTranslationService } from '../../services/google-translation.service';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-location-selection-sheet',
    imports: [MatBottomSheetModule, MatButtonModule, ScrollingModule, ReactiveFormsModule, TitleCasePipe, NgxSkeletonLoaderModule, IataSubstitutionPipe, MatSnackBarModule, XploraBottomSheetComponent],
    providers: [AirportSearchService, TitleCasePipe, IataSubstitutionPipe, GeolocationService],
    templateUrl: './location-selection-sheet.component.html',
    styleUrl: './location-selection-sheet.component.scss',
    animations: [
        trigger('listAnimation', [
            transition('* <=> *', [
                query(':enter', [style({ opacity: 0, transform: 'translateY(-15px)' }), stagger('100ms', animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })))], { optional: true })
            ])
        ])
    ]
})
export class LocationSelectionSheetComponent implements OnInit {
  searchInput = new FormControl('');
  locationResults:AmadeusLocation[]=[];
  loading:boolean=false;
  featuredLocations:AmadeusLocation[]=ORIGINS;
  suggestedDestinations:DirectDestination[]=[];
  constructor(
    private _bottomSheetRef: MatBottomSheetRef<LocationSelectionSheetComponent>, 
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: {
      isOrigin: boolean,
      suggestedDestinations?: DirectDestination[],
      excludedIataCode?: string
    },
    private airports: AirportSearchService,
    private translate: GoogleTranslationService,
    private location: GeolocationService,
    private _snackBar: MatSnackBar
  ){
    
  }
  ngOnInit(): void {
    const excludedIataCode = this.data.excludedIataCode?.toUpperCase();
    this.featuredLocations = ORIGINS.filter(location =>
      location.iataCode.toUpperCase() !== excludedIataCode
    );
    this.searchInput.enable();
    this.searchInput.valueChanges.pipe(debounceTime(500)).subscribe({
      next: (value)=>{
        this.locationResults=[];
        if(value!==null&&(value as string).length>1){
          this.searchAirports(value);
        }
      }
    });
    if(!this.data.isOrigin){
      const suggestions = (this.data.suggestedDestinations || []).filter(destination =>
        destination.iataCode.toUpperCase() !== excludedIataCode
      );
      if(suggestions.length > 0){
        this.loading=true;
        const solicitudesTraduccion = suggestions.map(resultado => {
          const traducirCityName = this.translate.translateV2(resultado.name, 'es');
          const traducirCountryName = this.translate.translateV2(resultado.address.countryName, 'es');
          return forkJoin([traducirCityName, traducirCountryName]).pipe(
            map(([cityNameTraducido, countryNameTraducido]) => ({
              ...resultado,
              address: {
                ...resultado.address,
                countryName: countryNameTraducido.data.translations[0].translatedText
              },
              name: cityNameTraducido.data.translations[0].translatedText
            })),
            catchError(error => {
              console.error('Error al traducir:', error);
              return of(resultado); // En caso de error, devuelve el resultado original
            })
          );
        });
        forkJoin(solicitudesTraduccion).subscribe(resultadosTraducidos => {
          this.suggestedDestinations=resultadosTraducidos;
          this.loading=false;
        });
      } else {
        this.suggestedDestinations = [];
        this.loading = false;
      }
    }
  }
  searchAirports(keyword:string){
    this.loading=true;
    this.airports.searchAirports(keyword).subscribe({
      next: (resultados) => {
        if(resultados.meta.count===0){
          this._snackBar.open('No se encontraron resultados', 'Cerrar', { duration: 3000 });
          this.loading=false;
        }else{
          const solicitudesTraduccion = resultados.data.map(resultado => {
          const traducirCityName = this.translate.translateV2(resultado.address.cityName, 'es');
          const traducirCountryName = this.translate.translateV2(resultado.address.countryName, 'es');
          return forkJoin([traducirCityName, traducirCountryName]).pipe(
            map(([cityNameTraducido, countryNameTraducido]) => ({
              ...resultado,
              address: {
                ...resultado.address,
                cityName: cityNameTraducido.data.translations[0].translatedText,
                countryName: countryNameTraducido.data.translations[0].translatedText
              }
            })),
            catchError(error => {
              console.error('Error al traducir:', error);
              return of(resultado); // En caso de error, devuelve el resultado original
            })
          );
        });
        forkJoin(solicitudesTraduccion).subscribe(resultadosTraducidos => {
          this.locationResults = resultadosTraducidos;
          this.loading=false;
        });
        }
      },
      error: (error:AmadeusLocationResponseError)=>{
        this.loading=false;
        this._snackBar.open('No se pudo consultar el catálogo de destinos.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  close(){
    this._bottomSheetRef.dismiss();
  }
  selectAirport(location:AmadeusLocation){
    this._bottomSheetRef.dismiss(location);
  }
  selectDirectDestination(destination:DirectDestination){
    this.loading=true;
    this.airports.getLocation("C"+destination.iataCode).subscribe({
      next: (location) => {
        this._bottomSheetRef.dismiss(location.data);
      },
      error: () => {
        this.loading = false;
        this._snackBar.open('No se pudo consultar ese destino.', 'Cerrar', { duration: 3000 });
      }
    });
  }
  nearbyAirports(){
    this.loading=true;
    this.location.getUbicacionActual().subscribe({
      next: (response) => {
        //console.log(response);
        this.airports.getNearbyAirports(response.coords.latitude, response.coords.longitude).subscribe({
          next: (resultados) => {
            //console.log(response);
            const solicitudesTraduccion = resultados.data.map(resultado => {
              const traducirCityName = this.translate.translateV2(resultado.address.cityName, 'es');
              const traducirCountryName = this.translate.translateV2(resultado.address.countryName, 'es')
              return forkJoin([traducirCityName, traducirCountryName]).pipe(
                map(([cityNameTraducido, countryNameTraducido]) => ({
                  ...resultado,
                  address: {
                    ...resultado.address,
                    cityName: cityNameTraducido.data.translations[0].translatedText,
                    countryName: countryNameTraducido.data.translations[0].translatedText
                  }
                })),
                catchError(error => {
                  console.error('Error al traducir:', error);
                  return of(resultado); // En caso de error, devuelve el resultado original
                })
              );
            });
            forkJoin(solicitudesTraduccion).subscribe(resultadosTraducidos => {
              this.locationResults = resultadosTraducidos;
              this.loading=false;
            });
          }
        });
      },
      error: (err:{code:number, message:string}) => {
        this.loading=false;
        if(err.code===1){
          this._snackBar.open('No se ha podido obtener tu ubicación.', undefined, { duration: 2000 });
        }
      }
    });
  }
}

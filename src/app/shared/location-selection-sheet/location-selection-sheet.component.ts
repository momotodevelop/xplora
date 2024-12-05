import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { response } from 'express';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, forkJoin, map, of, retry } from 'rxjs';
import {} from '@angular/common/http';
import { AmadeusLocation, AmadeusLocationResponseError } from '../../types/amadeus-airport-response.types';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { trigger, transition, style, query, stagger, animate } from '@angular/animations';
import { TranslateService } from '../../services/translate.service';
import { TitleCasePipe } from '@angular/common';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { IataSubstitutionPipe } from '../../iata-substitution.pipe';
import { ORIGINS } from '../../static/featured-origins.static';
import { DirectDestination } from '../../types/amadeus-direct-airport-response.types';
import { GeolocationService } from '../../services/geolocation.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-location-selection-sheet',
    imports: [MatBottomSheetModule, MatButtonModule, ScrollingModule, ReactiveFormsModule, TitleCasePipe, NgxSkeletonLoaderModule, IataSubstitutionPipe, MatSnackBarModule],
    providers: [AirportSearchService, AmadeusAuthService, TranslateService, TitleCasePipe, IataSubstitutionPipe, GeolocationService],
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
  public token:string|null=null;
  searchInput = new FormControl('');
  locationResults:AmadeusLocation[]=[];
  loading:boolean=false;
  featuredLocations:AmadeusLocation[]=ORIGINS;
  suggestedDestinations:DirectDestination[]=[];
  @ViewChild('search') searchElement!: ElementRef;
  constructor(
    private _bottomSheetRef: MatBottomSheetRef<LocationSelectionSheetComponent>, 
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { isOrigin: boolean, suggestedDestinations?: DirectDestination[] },
    private auth: AmadeusAuthService,
    private airports: AirportSearchService,
    private translate: TranslateService,
    private el: ElementRef<HTMLElement>,
    private location: GeolocationService,
    private _snackBar: MatSnackBar
  ){
    
  }
  ngOnInit(): void {
    this.searchInput.disable();
    this.generateToken();
    this.searchInput.valueChanges.pipe(debounceTime(2000)).subscribe({
      next: (value)=>{
        this.locationResults=[];
        if(value!==null&&(value as string).length>1){
          this.searchAirports(value);
        }
      }
    });
    if(!this.data.isOrigin){
      if(this.data.suggestedDestinations!==undefined){
        this.loading=true;
        const solicitudesTraduccion = this.data.suggestedDestinations.map(resultado => {
          const traducirCityName = this.translate.translateText(resultado.name, 'en', 'es');
          const traducirCountryName = this.translate.translateText(resultado.address.countryName, 'en', 'es');
          return forkJoin([traducirCityName, traducirCountryName]).pipe(
            map(([cityNameTraducido, countryNameTraducido]) => ({
              ...resultado,
              address: {
                ...resultado.address,
                countryName: countryNameTraducido
              },
              name: cityNameTraducido
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
      }
    }
  }
  searchAirports(keyword:string){
    this.loading=true;
    this.airports.searchAirports(keyword, this.token as string).subscribe({
      next: (resultados) => {
        const solicitudesTraduccion = resultados.data.map(resultado => {
          const traducirCityName = this.translate.translateText(resultado.address.cityName, 'en', 'es');
          const traducirCountryName = this.translate.translateText(resultado.address.countryName, 'en', 'es');
          return forkJoin([traducirCityName, traducirCountryName]).pipe(
            map(([cityNameTraducido, countryNameTraducido]) => ({
              ...resultado,
              address: {
                ...resultado.address,
                cityName: cityNameTraducido,
                countryName: countryNameTraducido
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
      },
      error: (error:AmadeusLocationResponseError)=>{
        if(error.status===401){
          this.generateToken().then(ok=>{
            if(ok){
              retry();
            }
          });
        }
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
    this.airports.getLocation("C"+destination.iataCode, this.token as string).subscribe({
      next: (location) => {
        this._bottomSheetRef.dismiss(location.data);
      }
    });
  }
  nearbyAirports(){
    this.loading=true;
    this.location.getUbicacionActual().subscribe({
      next: (response) => {
        console.log(response);
        this.airports.getNearbyAirports(response.coords.latitude, response.coords.longitude, this.token as string).subscribe({
          next: (resultados) => {
            console.log(response);
            const solicitudesTraduccion = resultados.data.map(resultado => {
              const traducirCityName = this.translate.translateText(resultado.address.cityName, 'en', 'es');
              const traducirCountryName = this.translate.translateText(resultado.address.countryName, 'en', 'es');
              return forkJoin([traducirCityName, traducirCountryName]).pipe(
                map(([cityNameTraducido, countryNameTraducido]) => ({
                  ...resultado,
                  address: {
                    ...resultado.address,
                    cityName: cityNameTraducido,
                    countryName: countryNameTraducido
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
  generateToken():Promise<Boolean>{
    return new Promise((resolve, reject)=>{
      this.auth.getToken().subscribe({
        next: (token) => {
          this.token=token;
          this.searchInput.enable();
          this.searchElement.nativeElement.focus()
          resolve(true);
        },
        error: (err) => {
          reject(err);
        }
      });
    });
  }
}

import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { FilterFormValue, SidebarComponent } from '../../pages/flight-search/sidebar/sidebar.component';
import { CarrierOption, FilterOptions, FlightOffersDataHandlerService, SortOptions } from '../../services/flight-offers-data-handler.service';
import { TitleCasePipe } from '@angular/common';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { FeatherIconsModule } from '../../modules/feather-icons/feather-icons.module';
import { FlightOffer } from '../../types/flight-offer-amadeus.types';
import _ from 'lodash';
import { combineLatest, debounceTime, first, map } from 'rxjs';

@Component({
    selector: 'app-flight-filters',
    imports: [MatCheckboxModule, ReactiveFormsModule, TitleCasePipe, MatSliderModule, FeatherIconsModule],
    templateUrl: './flight-filters.component.html',
    styleUrl: './flight-filters.component.scss'
})
export class FlightFiltersComponent {
  @Input() bottomSheet:boolean = false;
  @Output() updateFilterValue: EventEmitter<{
    filters: FilterOptions,
    sorting: SortOptions
  }> = new EventEmitter();
  @Output() updateFormValue: EventEmitter<FilterFormValue> = new EventEmitter()
  carrierOptions!:CarrierOption[];
  segments!:{min:number, max:number};
  stopsOptions:{text:string, value:number}[]=[];
  filtersFormGroup:FormGroup = new FormGroup({
    orderBy: new FormControl("duracion.asc"),
    stops: new FormArray([]),
    airlines: new FormArray([]),
    price: new FormGroup({
      min: new FormControl(0),
      max: new FormControl(0)
    }),
    departureTime: new FormControl(),
    arrivalTime: new FormControl()
  });
  prices: {min:number, max:number} = {min: 0, max: 0};
  filterByDeparture!:"MORNING"|"AFTERNOON"|"EVENING";
  filterByArrival!:"MORNING"|"AFTERNOON"|"EVENING";
  estimatedResults:number=0;
  constructor(private offersData:FlightOffersDataHandlerService){}
  updateData(value:{filters: FilterOptions, sorting:SortOptions}){
    this.estimatedResults = this.offersData.getEstimatedResults(value.filters, value.sorting);
  }
  ngOnInit(): void {
    this.offersData.carriers.subscribe(options=>{
      const carriersFormArray  = this.filtersFormGroup.get('airlines') as FormArray;
      this.carrierOptions=options;
      options.forEach(()=>{carriersFormArray.push(new FormControl(false))});
    });
    if(!this.bottomSheet){
      this.offersData.filterFormValue.subscribe((value)=>{
        if(value!==undefined){
          console.log(value);
          this.filtersFormGroup.setValue(value as any);
        }
      });
    }
    this.offersData.unfiltered.subscribe(results=>{
      if(results.length>0){
        this.prices=this.getMinMaxPrice(results);
        const pricesValues = this.filtersFormGroup.get("price") as FormGroup;
        pricesValues.get("min")?.setValue(this.prices.min);
        pricesValues.get("max")?.setValue(this.prices.max);
        this.segments=this.getMinMaxNumberOfSegments(results);
        let actualValue:number=this.segments.min;
        let stopsOptions:{text:string, value:number}[]=[];
        let stopsFormArray = this.filtersFormGroup.get('stops') as FormArray;
        while (actualValue<this.segments.max+1) {
          if(actualValue===1){
            stopsOptions.push({text: "Directo", value:actualValue})
          }else if(actualValue==2){
            stopsOptions.push({text: "1 Escala", value:actualValue})
          }else{
            stopsOptions.push({text: (actualValue-1).toString()+" Escalas", value: actualValue})
          }
          stopsFormArray.push(new FormControl(false));
          actualValue++; 
        }
        this.stopsOptions=stopsOptions;
        if(this.bottomSheet){
          combineLatest([this.offersData.filters, this.offersData.sorting]).pipe(first()).subscribe(data=>{
            console.log(data);
            this.setFilterOptionsToForm(data[0]!, this.filtersFormGroup, this.carrierOptions, this.stopsOptions);
          });
        }
      }
    });
    this.filtersFormGroup.valueChanges.pipe(debounceTime(500)).subscribe((value:FilterFormValue)=>{
      if(!this.bottomSheet){
        console.log(value)
        this.filterByDeparture = value.departureTime ?? undefined;
        this.filterByArrival = value.arrivalTime ?? undefined;
        const selectedStops:number[]=this.getSelectedStopsIds();
        const selectedAirlines:string[]=this.getSelectedAirlinesIds();
        this.offersData.filterOffers({
          segments: selectedStops,
          airlines: selectedAirlines,
          price: value.price,
          departureTime: value.departureTime,
          arrivalTime: value.arrivalTime
        }, ((value.orderBy as string).split(".") as SortOptions));
      }else{
        const filters:FilterOptions = {
          airlines: this.getSelectedAirlinesIds(),
          segments: this.getSelectedStopsIds(),
          arrivalTime: value.arrivalTime,
          departureTime: value.departureTime,
          price: value.price
        }
        const sorting:SortOptions = (value.orderBy as string).split(".") as SortOptions;
        this.updateFilterValue.emit({filters, sorting});
      }
    });
  }
  getSelectedStopsIds(): number[] {
    const selectedStopsValues: number[] = [];
    const stopsFormArray = this.filtersFormGroup.get('stops') as FormArray;

    stopsFormArray.controls.forEach((control, index) => {
      if (control.value === true) { // Si el control está marcado/seleccionado
        // Asume que el valor de `value` en stopsOptions es único y representa el ID
        const stopOption = this.stopsOptions[index].value;
        selectedStopsValues.push(stopOption); // Agrega al array
      }
    });

    return selectedStopsValues; // Devuelve el array de IDs seleccionados
  }
  setFilterOptionsToForm(filters: FilterOptions, filtersFormGroup: FormGroup, carrierOptions: CarrierOption[], stopsOptions: any[]): void {
    if (filters.airlines && filters.airlines.length > 0) {
      // Obtén el FormArray de aerolíneas del formulario
      const airlinesFormArray = filtersFormGroup.get('airlines') as FormArray;
      // Limpia el FormArray actual
      airlinesFormArray.clear();
      // Rellena el FormArray basado en los IDs de las aerolíneas seleccionadas
      carrierOptions.forEach(option => {
        airlinesFormArray.push(new FormControl(filters.airlines?.includes(option.id)));
      });
    }
  
    if (filters.segments && filters.segments.length>0) {
      console.log(filters.segments);
      // Obtén el FormArray de paradas del formulario
      const stopsFormArray = filtersFormGroup.get('stops') as FormArray;
      // Limpia el FormArray actual
      stopsFormArray.clear();
      // Rellena el FormArray basado en los segmentCounts seleccionados
      console.log(stopsOptions);
      stopsOptions.forEach((option, index) => {
        // Asume que la opción de paradas se mapea 1:1 con el número de segmentos - 1 (por ejemplo, 0 paradas = 1 segmento)
        stopsFormArray.push(new FormControl(filters.segments?.includes(index+2)));
      });
    }
  
    // Para los otros filtros como departureTime y arrivalTime, se asume que son controles simples dentro del FormGroup
    if (filters.departureTime) {
      filtersFormGroup.get('departureTime')!.setValue(filters.departureTime);
    }
    if (filters.arrivalTime) {
      filtersFormGroup.get('arrivalTime')!.setValue(filters.arrivalTime);
    }
  }
  formatSliderLabel(value:number):string{
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      // Opciones adicionales como mostrar decimales
      minimumFractionDigits: 0,
    });
    return formatter.format(value);
  }
  getSelectedAirlinesIds(): string[] {
    const selectedAirlinesValues: string[] = [];
    const airlinesFormArray = this.filtersFormGroup.get('airlines') as FormArray;

    airlinesFormArray.controls.forEach((control, index) => {
      if (control.value === true) { // Si el control está marcado/seleccionado
        // Asume que el valor de `value` en stopsOptions es único y representa el ID
        const airlineOption = this.carrierOptions[index].id;
        selectedAirlinesValues.push(airlineOption); // Agrega al array
      }
    });

    return selectedAirlinesValues; // Devuelve el array de IDs seleccionados
  }
  getMinMaxNumberOfSegments(flightOffers: FlightOffer[]): { min: number, max: number } {
    let min = Number.MAX_SAFE_INTEGER; // Inicializa al valor máximo seguro para encontrar el mínimo
    let max = 0; // Inicializa a 0 para encontrar el máximo

    flightOffers.forEach(offer => {
        if (offer.itineraries.length > 0) {
            const segmentCount = offer.itineraries[0].segments.length;
            if (segmentCount < min) {
                min = segmentCount; // Actualiza el mínimo si se encuentra uno menor
            }
            if (segmentCount > max) {
                max = segmentCount; // Actualiza el máximo si se encuentra uno mayor
            }
        }
    });

    // Asegura que min se ajuste si no se modificó (significaría que no había ofertas)
    if (min === Number.MAX_SAFE_INTEGER) {
        min = 0;
    }

    return { min, max }; // Devuelve tanto el mínimo como el máximo
  }
  getMinMaxPrice(offers: FlightOffer[]): { min: number; max: number } {
    // Extrae todos los precios de las ofertas de vuelo
    const prices = offers.map(offer => offer.price.total as number); // Ajusta el acceso a la propiedad según tu estructura

    // Usa Lodash para encontrar los precios mínimo y máximo
    const minPrice = _.min(prices) ?? 0;
    const maxPrice = _.max(prices) ?? 0;

    // Retorna un objeto con los precios mínimo y máximo
    return { min: minPrice, max: maxPrice };
  }
}

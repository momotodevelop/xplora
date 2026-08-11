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
    orderBy: new FormControl("precio.asc"),
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
  filterByDeparture?:"MORNING"|"AFTERNOON"|"EVENING";
  filterByArrival?:"MORNING"|"AFTERNOON"|"EVENING";
  estimatedResults:number=0;
  constructor(private offersData:FlightOffersDataHandlerService){}
  updateData(value:{filters: FilterOptions, sorting:SortOptions}){
    this.estimatedResults = this.offersData.getEstimatedResults(value.filters, value.sorting);
  }
  ngOnInit(): void {
    this.offersData.carriers.subscribe(options=>{
      const carriersFormArray  = this.filtersFormGroup.get('airlines') as FormArray;
      this.carrierOptions=options;
      carriersFormArray.clear({emitEvent: false});
      options.forEach(()=>{carriersFormArray.push(new FormControl(false), {emitEvent: false})});
    });
    if(!this.bottomSheet){
      this.offersData.filterFormValue.subscribe((value)=>{
        if(value!==undefined){
          //console.log(value);
          this.filtersFormGroup.setValue(value as any);
        }
      });
    }
    this.offersData.unfiltered.subscribe(results=>{
      if(results.length>0){
        this.prices=this.getMinMaxPrice(results);
        const pricesValues = this.filtersFormGroup.get("price") as FormGroup;
        pricesValues.get("min")?.setValue(this.prices.min, {emitEvent: false});
        pricesValues.get("max")?.setValue(this.prices.max, {emitEvent: false});
        this.segments=this.getMinMaxNumberOfSegments(results);
        let actualValue:number=this.segments.min;
        let stopsOptions:{text:string, value:number}[]=[];
        let stopsFormArray = this.filtersFormGroup.get('stops') as FormArray;
        stopsFormArray.clear({emitEvent: false});
        while (actualValue<this.segments.max+1) {
          if(actualValue===1){
            stopsOptions.push({text: "Directo", value:actualValue})
          }else if(actualValue==2){
            stopsOptions.push({text: "1 Escala", value:actualValue})
          }else{
            stopsOptions.push({text: (actualValue-1).toString()+" Escalas", value: actualValue})
          }
          stopsFormArray.push(new FormControl(false), {emitEvent: false});
          actualValue++; 
        }
        this.stopsOptions=stopsOptions;
        combineLatest([this.offersData.filters, this.offersData.sorting]).pipe(first()).subscribe(data=>{
          this.setFilterOptionsToForm(
            data[0] ?? {},
            data[1] ?? ['precio', 'asc'],
            this.filtersFormGroup,
            this.carrierOptions,
            this.stopsOptions
          );
        });
      }
    });
    this.filtersFormGroup.valueChanges.pipe(debounceTime(500)).subscribe((value:FilterFormValue)=>{
      if(!this.bottomSheet){
        //console.log(value)
        this.filterByDeparture = value.departureTime ?? undefined;
        this.filterByArrival = value.arrivalTime ?? undefined;
        const selectedStops:number[]=this.getSelectedStopsIds();
        const selectedAirlines:string[]=this.getSelectedAirlinesIds();
        this.offersData.filterOffers({
          segments: selectedStops,
          airlines: selectedAirlines,
          price: value.price,
          departureTime: value.departureTime ?? undefined,
          arrivalTime: value.arrivalTime ?? undefined
        }, ((value.orderBy as string).split(".") as SortOptions));
      }else{
        const filters:FilterOptions = {
          airlines: this.getSelectedAirlinesIds(),
          segments: this.getSelectedStopsIds(),
          arrivalTime: value.arrivalTime ?? undefined,
          departureTime: value.departureTime ?? undefined,
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
  setFilterOptionsToForm(
    filters: FilterOptions,
    sorting: SortOptions,
    filtersFormGroup: FormGroup,
    carrierOptions: CarrierOption[],
    stopsOptions: {text:string, value:number}[]
  ): void {
    filtersFormGroup.get('orderBy')?.setValue(`${sorting[0]}.${sorting[1]}`, {emitEvent: false});

    const airlinesFormArray = filtersFormGroup.get('airlines') as FormArray;
    carrierOptions.forEach((option, index) => {
      airlinesFormArray.at(index)?.setValue(Boolean(filters.airlines?.includes(option.id)), {emitEvent: false});
    });

    const stopsFormArray = filtersFormGroup.get('stops') as FormArray;
    stopsOptions.forEach((option, index) => {
      stopsFormArray.at(index)?.setValue(Boolean(filters.segments?.includes(option.value)), {emitEvent: false});
    });

    filtersFormGroup.get('price')?.setValue({
      min: filters.price?.min ?? this.prices.min,
      max: filters.price?.max ?? this.prices.max
    }, {emitEvent: false});
    filtersFormGroup.get('departureTime')?.setValue(filters.departureTime ?? null, {emitEvent: false});
    filtersFormGroup.get('arrivalTime')?.setValue(filters.arrivalTime ?? null, {emitEvent: false});
    this.filterByDeparture = filters.departureTime;
    this.filterByArrival = filters.arrivalTime;
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
    // Extrae precios comparables (si hay promo, usa el rebajado)
    const prices = offers.map(offer => {
      const promoTotal = offer.promoPrice?.discountedTotal;
      if (Number.isFinite(promoTotal)) return promoTotal as number;
      const raw = offer.price.total ?? offer.price.grandTotal;
      const total = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '0'));
      return Number.isFinite(total) ? total : 0;
    });

    // Usa Lodash para encontrar los precios mínimo y máximo
    const minPrice = _.min(prices) ?? 0;
    const maxPrice = _.max(prices) ?? 0;

    // Retorna un objeto con los precios mínimo y máximo
    return { min: minPrice, max: maxPrice };
  }
}

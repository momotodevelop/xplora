import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconDefinition } from '@fortawesome/angular-fontawesome';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { faSwimmingPool, faSpa, faDumbbell, faSnowflake, faUtensils, faParking, faDog, faShuttleVan, faBriefcase, faWheelchair, faWifi, faChalkboardTeacher, faChild, faTableTennis, faGolfBall, faKitchenSet, faPaw, faBaby, faUmbrellaBeach, faDice, faHotTub, faFire, faSun, faHandHoldingHeart, faCarSide, faGlassMartini, faFilm, faCocktail, faTv, faConciergeBell, faUtensilSpoon } from '@fortawesome/free-solid-svg-icons';
import { debounceTime } from 'rxjs';
import { Hotel } from '../../../../types/amadeus-hotels-response.types';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { HotelListResult } from '../../../../types/lite-api.types';
export interface Filter {
  name: string; // Nombre del filtro en español
  id: string; // Identificador único del filtro
  checked: boolean; // Estado inicial del filtro (seleccionado o no)
  icon: IconDefinition; // Ícono de Font Awesome Angular
}
export const filters:Filter[] = [
  { name: 'Piscina', id: 'SWIMMING_POOL', checked: false, icon: faSwimmingPool },
  { name: 'Spa', id: 'SPA', checked: false, icon: faSpa },
  { name: 'Gimnasio', id: 'FITNESS_CENTER', checked: false, icon: faDumbbell },
  { name: 'Aire acondicionado', id: 'AIR_CONDITIONING', checked: false, icon: faSnowflake },
  { name: 'Restaurante', id: 'RESTAURANT', checked: false, icon: faUtensils },
  { name: 'Estacionamiento', id: 'PARKING', checked: false, icon: faParking },
  { name: 'Se permiten mascotas', id: 'PETS_ALLOWED', checked: false, icon: faDog },
  { name: 'Transporte al aeropuerto', id: 'AIRPORT_SHUTTLE', checked: false, icon: faShuttleVan },
  { name: 'Centro de negocios', id: 'BUSINESS_CENTER', checked: false, icon: faBriefcase },
  { name: 'Acceso para discapacitados', id: 'DISABLED_FACILITIES', checked: false, icon: faWheelchair },
  { name: 'WiFi', id: 'WIFI', checked: false, icon: faWifi },
  { name: 'Salas de reuniones', id: 'MEETING_ROOMS', checked: false, icon: faChalkboardTeacher },
  { name: 'Sin niños', id: 'NO_KID_ALLOWED', checked: false, icon: faChild },
  { name: 'Tenis', id: 'TENNIS', checked: false, icon: faTableTennis },
  { name: 'Golf', id: 'GOLF', checked: false, icon: faGolfBall },
  { name: 'Cocina', id: 'KITCHEN', checked: false, icon: faKitchenSet },
  { name: 'Observación de animales', id: 'ANIMAL_WATCHING', checked: false, icon: faPaw },
  { name: 'Cuidado de bebés', id: 'BABY-SITTING', checked: false, icon: faBaby },
  { name: 'Playa', id: 'BEACH', checked: false, icon: faUmbrellaBeach },
  { name: 'Casino', id: 'CASINO', checked: false, icon: faDice },
  { name: 'Jacuzzi', id: 'JACUZZI', checked: false, icon: faHotTub },
  { name: 'Sauna', id: 'SAUNA', checked: false, icon: faFire },
  { name: 'Solárium', id: 'SOLARIUM', checked: false, icon: faSun },
  { name: 'Masaje', id: 'MASSAGE', checked: false, icon: faHandHoldingHeart },
  { name: 'Valet Parking', id: 'VALET_PARKING', checked: false, icon: faCarSide },
  { name: 'Bar o lounge', id: 'BAR or LOUNGE', checked: false, icon: faGlassMartini },
  { name: 'Niños bienvenidos', id: 'KIDS_WELCOME', checked: false, icon: faChild },
  { name: 'Sin películas para adultos', id: 'NO_PORN_FILMS', checked: false, icon: faFilm },
  { name: 'Minibar', id: 'MINIBAR', checked: false, icon: faCocktail },
  { name: 'Televisión', id: 'TELEVISION', checked: false, icon: faTv },
  { name: 'WiFi en la habitación', id: 'WI-FI_IN_ROOM', checked: false, icon: faWifi },
  { name: 'Servicio a la habitación', id: 'ROOM_SERVICE', checked: false, icon: faConciergeBell },
  { name: 'Estacionamiento vigilado', id: 'GUARDED_PARKG', checked: false, icon: faParking },
  { name: 'Menús especiales', id: 'SERV_SPEC_MENU', checked: false, icon: faUtensilSpoon },
];
@Component({
  selector: 'app-hotel-filters',
  imports: [FormsModule, ReactiveFormsModule, MatAutocompleteModule, CommonModule],
  templateUrl: './hotel-sidebar-filters.component.html',
  styleUrl: './hotel-sidebar-filters.component.scss',
  providers: [TitleCasePipe]
})
export class HotelSidebarFiltersComponent implements OnInit {
  @Input() hotelList!:HotelListResult[];
  @Input() activeAmenities:string[] = [];
  @Output() amenitiesFilter: EventEmitter<string[]> = new EventEmitter();
  @Output() hotelFilter: EventEmitter<HotelListResult> = new EventEmitter();
  filters:Filter[]=filters;
  form!:FormGroup;
  activeFilters:string[]=[];
  hotelFilterOptions:HotelListResult[] = [];
  constructor(private fb: FormBuilder, private title: TitleCasePipe){
    
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      filters: this.fb.array(this.filters.map(filter=>{
        const isActive = this.activeAmenities.includes(filter.id);
        return this.fb.control(isActive);
      })),
      hotel: this.fb.control(null)
    });
    this.checkboxes.valueChanges.subscribe(filters=>{
      const selectedFilters = this.filters
      .map((filter, i) => ({ ...filter, checked: filters[i] }))
      .filter(filter => filter.checked);
      this.activeFilters=selectedFilters.map(filter=>filter.id);
      this.amenitiesFilter.emit(this.activeFilters);
    });
    this.hotelInput.valueChanges.pipe(debounceTime(200)).subscribe(value=>{
        if(value!==undefined){
          this.filter(value);
        }
    });
    //console.log(this.hotelInput.pristine);
    //console.log(this.checkboxes);
  }
  get checkboxes() : FormArray {
    return this.form.get('filters') as FormArray;
  }
  get hotelInput() : FormControl{
    return this.form.get('hotel') as FormControl;
  }
  filter(query:string){
    if(query.length>2){
      this.hotelFilterOptions = this.hotelList.filter(hotel => hotel.name.toLowerCase().includes(query.toLowerCase()));
    }else{
      this.hotelFilterOptions = this.hotelList;
    }
    //console.log(this.hotelFilterOptions);
  }
  resetHotelInput(){
    this.hotelInput.reset();
  }
  hotelSelected(value:MatAutocompleteSelectedEvent){
    const hotel = this.hotelList.find(hotel=>hotel.id===value.option.value);
    this.hotelFilter.emit(hotel);
    if(hotel){
      this.hotelInput.setValue(this.title.transform(hotel.name));
    }
  }
}

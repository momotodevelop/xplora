import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { AirportSearchService } from '../../../services/airport-search.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AmadeusLocation } from '../../../types/amadeus-airport-response.types';
import { MatInputModule } from '@angular/material/input';
import { GoogleDirectionsService } from '../../../services/google-directions.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { HotelBookingDetails } from '../../../types/booking.types';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { HotelBookingAddonsTransfersSheetComponent } from './hotel-booking-addons-transfers-sheet/hotel-booking-addons-transfers-sheet.component';

interface AdditionalService {
  name: string;
  description: string;
  price?: number; // Si no tiene un precio fijo, se muestra "Precio variable"
  active: boolean;
  image: string;
}

@Component({
  selector: 'app-hotel-booking-addons',
  imports: [
    MatExpansionModule, 
    MatCheckboxModule, 
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatListModule,
    HotelBookingAddonsTransfersSheetComponent,
    MatBottomSheetModule
  ],
  templateUrl: './hotel-booking-addons.component.html',
  styleUrl: './hotel-booking-addons.component.scss'
})
export class HotelBookingAddonsComponent {
  @Input() location!:{lat:number,lng:number};
  @Input() guests!:{adults:number ,childrens:number};
  @Input() hotelName!:string;
  additionalServices: AdditionalService[] = [
    { 
      name: 'Renta de auto', 
      description: 'Explora tu destino a tu ritmo con un auto de renta. Elige entre opciones compactas, SUVs o modelos de lujo, todos con seguro incluido y asistencia 24/7. ¡Sin tarifas ocultas y con la libertad de moverte sin depender del transporte público!', 
      active: false,
      image: 'https://source.unsplash.com/400x300/?car,rental'
    },
    { 
      name: 'Seguro de cancelación', 
      description: 'Viaja con total tranquilidad reservando nuestro seguro de cancelación. Si un imprevisto como enfermedad, mal clima o problemas de última hora te impide viajar, obtén un reembolso total o parcial sin complicaciones. ¡Tu dinero está protegido!', 
      price: 20,
      image: 'https://source.unsplash.com/400x300/?insurance,cancellation',
      active: false 
    },
    { 
      name: 'Seguro de viajero', 
      description: 'Disfruta cada momento de tu viaje con la seguridad de estar protegido. Nuestro seguro de viajero cubre asistencia médica, accidentes, pérdida de equipaje y cancelaciones inesperadas. ¡Tu bienestar es nuestra prioridad!', 
      price: 30,
      image: 'https://source.unsplash.com/400x300/?travel,insurance',
      active: false 
    }
  ];
  constructor(private bs: MatBottomSheet){}
  openTransfers(){
    const data = {
      lat: this.location.lat,
      lng: this.location.lng,
      guests: this.guests.adults + this.guests.childrens,
      hotelName: this.hotelName
    }
    console.log(data);
    this.bs.open(HotelBookingAddonsTransfersSheetComponent, {
      data,
      panelClass: ['bottomsheet-no-padding', 'bottomsheet-extras']
    });
  }
}

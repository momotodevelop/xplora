import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { MatChipsModule } from '@angular/material/chips';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
export interface ContactInfoValue{
  name: string,
  lastname: string,
  phone: string,
  email: string,
  country_code: string
}

@Component({
  selector: 'app-contact-info',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule],
  templateUrl: './contact-info.component.html',
  styleUrl: './contact-info.component.scss'
})
export class ContactInfoComponent {
  @Output() valid: EventEmitter<ContactInfoValue|undefined> = new EventEmitter();
  countries = [
    { id: 'MX', name: 'México', code: '52', priority: 3 },
    { id: 'US', name: 'Estados Unidos', code: '1', priority: 2 },
    { id: 'AR', name: 'Argentina', code: '54', priority: 1 },
    { id: 'BO', name: 'Bolivia', code: '591', priority: 1 },
    { id: 'BR', name: 'Brasil', code: '55', priority: 1 },
    { id: 'CL', name: 'Chile', code: '56', priority: 1 },
    { id: 'CO', name: 'Colombia', code: '57', priority: 1 },
    { id: 'EC', name: 'Ecuador', code: '593', priority: 1 },
    { id: 'PY', name: 'Paraguay', code: '595', priority: 1 },
    { id: 'PE', name: 'Perú', code: '51', priority: 1 },
    { id: 'UY', name: 'Uruguay', code: '598', priority: 1 },
    { id: 'VE', name: 'Venezuela', code: '58', priority: 1 },
    { id: 'CR', name: 'Costa Rica', code: '506', priority: 1 },
    { id: 'SV', name: 'El Salvador', code: '503', priority: 1 },
    { id: 'GT', name: 'Guatemala', code: '502', priority: 1 },
    { id: 'HN', name: 'Honduras', code: '504', priority: 1 },
    { id: 'NI', name: 'Nicaragua', code: '505', priority: 1 },
    { id: 'PA', name: 'Panamá', code: '507', priority: 1 },
    { id: 'CA', name: 'Canadá', code: '1', priority: 0 },
    { id: 'CU', name: 'Cuba', code: '53', priority: 0 },
    { id: 'HT', name: 'Haití', code: '509', priority: 0 },
    { id: 'JM', name: 'Jamaica', code: '1', priority: 0 },
    { id: 'DO', name: 'República Dominicana', code: '1', priority: 0 },
    { id: 'BS', name: 'Bahamas', code: '1', priority: 0 },
    { id: 'ES', name: 'España', code: '34', priority: 0 },
    { id: 'FR', name: 'Francia', code: '33', priority: 0 },
    { id: 'DE', name: 'Alemania', code: '49', priority: 0 },
    { id: 'IT', name: 'Italia', code: '39', priority: 0 },
    { id: 'GB', name: 'Reino Unido', code: '44', priority: 0 },
    { id: 'RU', name: 'Rusia', code: '7', priority: 0 },
    { id: 'CN', name: 'China', code: '86', priority: 0 },
    { id: 'JP', name: 'Japón', code: '81', priority: 0 },
    { id: 'IN', name: 'India', code: '91', priority: 0 },
    { id: 'AU', name: 'Australia', code: '61', priority: 0 },
    { id: 'NZ', name: 'Nueva Zelanda', code: '64', priority: 0 },
    { id: 'ZA', name: 'Sudáfrica', code: '27', priority: 0 }
    // Añade más países si es necesario
  ];
  countryCode: string = '52';
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, Validators.minLength(9)]),
    country_code: new FormControl('52', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastname: new FormControl('', [Validators.required, Validators.minLength(2)])
  });
  bookingData?:XploraFlightBooking;
  constructor(private booking: BookingHandlerService){
    this.form.valueChanges.subscribe(change=>{
      this.change();
    });
    this.booking.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.bookingData = booking;
        if(booking.contact!==undefined){
          this.form.setValue(booking.contact);
          this.valid.emit(booking.contact!)
        }
      }
    })
  }
  change(){
    if(this.form.valid){
      this.valid.emit(this.form.value);
    }else{
      this.valid.emit(undefined);
    }
  }
  autoFill(name:string, lastname:string){
    this.form.controls['name'].setValue(name);
    this.form.controls['lastname'].setValue(lastname);
  }
}

import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { MatChipsModule } from '@angular/material/chips';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import { FlightFirebaseBooking } from '../../../types/booking.types';
import { FireBookingService } from '../../../services/fire-booking.service';
import { FireAuthService } from '../../../services/fire-auth.service';
import { WORLD_COUNTRIES } from '../../../static/countries.static';
export interface ContactInfoValue{
  name: string,
  lastname: string,
  phone: string,
  email: string,
  country_code: string
}

@Component({
    selector: 'app-contact-info',
    imports: [ReactiveFormsModule, FormsModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule],
    templateUrl: './contact-info.component.html',
    styleUrl: './contact-info.component.scss'
})
export class ContactInfoComponent {
  @Output() valid: EventEmitter<ContactInfoValue|undefined> = new EventEmitter();
  countries = WORLD_COUNTRIES;
  countryCode: string = '52';
  form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', [Validators.required, Validators.minLength(9)]),
    country_code: new FormControl('52', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastname: new FormControl('', [Validators.required, Validators.minLength(2)])
  });
  bookingData?:FlightFirebaseBooking;
  passengersChips: {name: string, lastname: string}[] = [];
  constructor(private booking: BookingHandlerService, private auth: FireAuthService) {
    this.form.valueChanges.subscribe(change=>{
      this.change();
    });
    this.booking.booking.subscribe(booking=>{
      if(booking!==undefined){
        this.bookingData = booking;
        if(booking.flightDetails!.passengers.details){
          this.passengersChips = booking.flightDetails!.passengers.details.filter(passenger => passenger.type==='ADULT').map((passenger)=>{
            return {
              name: passenger.name,
              lastname: passenger.lastname
            }
          });
        }
        if(booking.contact!==undefined){
          this.form.setValue(booking.contact);
          this.valid.emit(booking.contact!);
        }
      }
    });
    this.auth.user.subscribe(user=>{
      if(user){
        if(user.email){
          const emailControl = this.form.controls['email'];
          emailControl.setValue(user.email);
          emailControl.disable();
        }
      }
    });
  }
  change(){
    if(this.form.valid){
      this.valid.emit(this.form.getRawValue() as ContactInfoValue);
    }else{
      this.valid.emit(undefined);
    }
  }
  autoFill(name:string, lastname:string){
    this.form.controls['name'].setValue(name);
    this.form.controls['lastname'].setValue(lastname);
  }
}

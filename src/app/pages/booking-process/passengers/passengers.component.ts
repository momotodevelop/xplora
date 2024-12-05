import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BookingHandlerService } from '../../../services/booking-handler.service';

export interface PassengerValue {
  id:       number;
  name:     string;
  lastname: string;
  birth:    Date;
  gender:   string;
  type:     "ADULT"|"CHILDREN"|"INFANT";
  minDate?:      Date;
  maxDate?:      Date;
}
export interface PassengerFormValue {
  name:     string;
  lastname: string;
  birth:    Date;
  gender:   string;
}

@Component({
    selector: 'app-passengers',
    imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatDatepickerModule, FormsModule, MatNativeDateModule, MatOptionModule, MatSelectModule],
    templateUrl: './passengers.component.html',
    styleUrl: './passengers.component.scss'
})
export class PassengersComponent implements OnInit {
  @Input() adults!: number;
  @Input() childrens!: number;
  @Input() infants!: number;
  @Input() passengersData!:PassengerValue[];
  @Output() valid: EventEmitter<PassengerValue[]|undefined> = new EventEmitter();
  form: FormGroup;
  passengerTitles:string[]=[];
  passengerDetails:{
    minDate: Date|undefined,
    maxDate: Date|undefined,
    id: number
    type: "ADULT"|"CHILDREN"|"INFANT"
  }[]=[];
  dateLimits:{
    adult:{
      min: Date|null,
      max: Date|null
    },
    children:{
      min: Date|null,
      max: Date|null
    },
    infant:{
      min: Date|null,
      max: Date|null
    }
  }
  constructor(private fb: FormBuilder, private bookingHandler:BookingHandlerService){
    const today = new Date();
    this.form = this.fb.group({
      passengers: this.fb.array([])
    });
    this.dateLimits = {
      adult: {
        max: new Date(today.getFullYear() - 12, today.getMonth(), today.getDate()),
        min: null
      },
      children: {
        max: new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()),
        min: new Date(today.getFullYear() - 12, today.getMonth(), today.getDate())
      },
      infant: {
        max: today,
        min: new Date(today.getFullYear() - 2, today.getMonth(), today.getDate())
      }
    }
    console.log(this.dateLimits);
  }
  ngOnInit(): void {
    console.log(this.dateLimits);
    this.initializeForm();
    console.log(this.passengers);
    this.bookingHandler.booking.subscribe(booking=>{
      if(booking!==undefined){
        let passengersData = booking.passengersData;
        if(passengersData!==undefined&&passengersData.length>0){
          passengersData.forEach((passenger,i)=>{
            let passengerGroup = (this.form.get('passengers') as FormArray).controls[i] as FormGroup;
            if(passenger.name!==undefined&&passenger.name!==null){
              passengerGroup.get('name')?.setValue(passenger.name)
            }
            if(passenger.lastname!==undefined&&passenger.lastname!==null){
              passengerGroup.get('lastname')?.setValue(passenger.lastname)
            }
            if(passenger.birth!==undefined&&passenger.birth!==null){
              passengerGroup.get('birth')?.setValue(passenger.birth)
            }
            if(passenger.gender!==undefined&&passenger.gender!==null){
              passengerGroup.get('gender')?.setValue(passenger.gender)
            }
          });
          this.emitFormData();
        }else{
          this.passengers.reset();
        }
      }
    })
    this.form.valueChanges.subscribe(()=>{
      if(this.form.valid){
        this.emitFormData();
      }else{
        this.valid.emit(undefined);
      }
    });
  }
  get passengers(): FormArray {
    return this.form.get('passengers') as FormArray;
  }
  emitFormData(){
    const data:PassengerValue[]=this.form.get('passengers')!.value.map((passenger:PassengerFormValue, i:number)=>{
      const value:PassengerValue = {
        name: passenger.name,
        lastname: passenger.lastname,
        birth: passenger.birth,
        gender: passenger.gender,
        type: this.passengerDetails[i].type,
        id: i,
        minDate: this.passengerDetails[i].minDate,
        maxDate: this.passengerDetails[i].maxDate
      };
      return value;
    });
    console.log(data);
    this.valid.emit(data);
  }
  initializeForm(): void {
    let id:number = 1;
    let adultIterator:number = 1;
    let childrenIterator:number = 1;
    let infantIterator:number = 1;
    for (let i = 0; i < this.adults; i++) {
      this.addPassenger('ADULT', id, adultIterator);
      id++;
      adultIterator++;
    }
    for (let i = 0; i < this.childrens; i++) {
      this.addPassenger('CHILDREN', id, childrenIterator);
      id++;
      childrenIterator++;
    }
    for (let i = 0; i < this.infants; i++) {
      this.addPassenger('INFANT', id, infantIterator);
      id++;
      infantIterator++;
    }
    console.log(this.passengers);
  }
  addPassenger(type: "ADULT"|"CHILDREN"|"INFANT", id:number, iteratorNumber:number): void {
    let passengerForm:FormGroup;
    // Si el pasajero es un infante, añadir un campo para seleccionar el adulto relacionado
    const today = new Date();
    let minDate: Date|undefined;
    let maxDate: Date|undefined;

    // Establecer rangos de fecha según el tipo
    if (type === 'ADULT') {
      maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
    } else if (type === 'CHILDREN') {
      minDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
      maxDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    } else {  // INFANT
      minDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
      maxDate = today;
    }
    passengerForm = this.fb.group({
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      birth: ['', Validators.required],
      gender: ['', Validators.required]
    });
    let passengerTypeText;
    switch(type){
      case "ADULT":
        passengerTypeText = "Adulto ";
        break;
      case "CHILDREN":
        passengerTypeText = "Menor ";
        break;
      case "INFANT":
        passengerTypeText = "Infante ";
        break;
    }
    this.passengerTitles.push(passengerTypeText+iteratorNumber.toString());
    this.passengerDetails.push({id, maxDate, minDate, type})
    this.passengers.push(passengerForm);
    console.log(passengerForm);
    console.log(minDate, maxDate);
  }
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-passengers',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatDatepickerModule, FormsModule, MatNativeDateModule, MatOptionModule, MatSelectModule],
  templateUrl: './passengers.component.html',
  styleUrl: './passengers.component.scss'
})
export class PassengersComponent implements OnInit {
  @Input() adults!: number;
  @Input() childrens!: number;
  @Input() infants!: number;
  @Output() valid: EventEmitter<boolean> = new EventEmitter();
  form: FormGroup;
  passengerTitles:string[]=[];
  constructor(private fb: FormBuilder){
    this.form = this.fb.group({
      passengers: this.fb.array([])
    });
  }
  ngOnInit(): void {
    this.initializeForm();
    console.log(this.passengers);
    this.form.valueChanges.subscribe(()=>{
      this.valid.emit(this.form.valid);
    });
  }
  get passengers(): FormArray {
    return this.form.get('passengers') as FormArray;
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
  }
  addPassenger(type: "ADULT"|"CHILDREN"|"INFANT", id:number, iteratorNumber:number): void {
    let passengerForm:FormGroup;
    // Si el pasajero es un infante, añadir un campo para seleccionar el adulto relacionado
    if (type === 'INFANT') {
      passengerForm = this.fb.group({
        id: [id], 
        name: ['', Validators.required],
        lastname: ['', Validators.required],
        birth: ['', Validators.required],
        gender: ['', Validators.required],
        type: ["INFANT"],
        linkedAdult: ['', Validators.required]
      });
      this.passengerTitles.push("Infante "+iteratorNumber.toString());
    }else{
      passengerForm = this.fb.group({
        id: [id], 
        name: ['', Validators.required],
        lastname: ['', Validators.required],
        birth: ['', Validators.required],
        gender: ['', Validators.required],
        type: [type]
      });
      this.passengerTitles.push((type==="CHILDREN"?"Menor ":"Adulto ")+iteratorNumber.toString());
    }
    
    this.passengers.push(passengerForm);
  }
}

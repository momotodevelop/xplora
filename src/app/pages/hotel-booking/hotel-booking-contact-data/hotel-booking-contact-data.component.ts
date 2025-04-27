import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HolderData } from '../hotel-booking-room-data/hotel-booking-room-data.component';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatChipListbox, MatChipListboxChange, MatChipSet, MatChipsModule } from '@angular/material/chips';
import { CountryData, CountryDataDisplay, RestcountriesService } from '../../../services/restcountries.service';
import { MatSelectModule } from '@angular/material/select';
import { PhoneFormatDirective } from '../../../phone-format.directive';

export interface ContactData {name:string, lastname: string, email: string, phone: string, countryCode: string};

@Component({
  selector: 'app-hotel-booking-contact-data',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule, MatChipsModule, MatSelectModule, PhoneFormatDirective],
  templateUrl: './hotel-booking-contact-data.component.html',
  styleUrl: './hotel-booking-contact-data.component.scss'
})
export class HotelBookingContactDataComponent implements OnInit, OnChanges {
  constructor(private countries: RestcountriesService) { }
  @ViewChild('chips') chipSet!: MatChipListbox;
  @Input() roomsHolders!: HolderData[];
  @Output() contactData: EventEmitter<ContactData> = new EventEmitter();
  form: FormGroup = new FormGroup({
    name: new FormControl(null, [Validators.required, Validators.minLength(2)]),
    lastname: new FormControl(null, [Validators.required, Validators.minLength(2)]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    countryCode: new FormControl(null, [Validators.required]),
    phone: new FormControl(null, [Validators.required, Validators.minLength(9)])
  });
  selectedHolder?:number;
  countriesData:CountryDataDisplay[]=[];
  selectedCountry?:CountryDataDisplay;
  ngOnInit(): void {
    this.form.valueChanges.subscribe((value:ContactData)=>{
      if(this.form.controls['name'].value !== this.selectedHolderData?.name){
        //this.selectedHolder = undefined;
        this.chipSet.writeValue(undefined);
        //if(this.form.controls['name'].pristine) this.selectedHolder = undefined;
          
      }
      if(this.form.controls['lastname'].value !== this.selectedHolderData?.lastname){
        //this.selectedHolder = undefined;
        this.chipSet.writeValue(undefined);
        //if(this.form.controls['lastname'].pristine) this.selectedHolder = undefined;
      }
      if(this.form.valid){
        this.contactData.emit(value);
      }
    });
    this.countries.getCountries().then(codes=>{
      this.countriesData = codes.map(c=>this.countries.simplifyCountryData(c)).sort((a,b)=>{
        return a.translations['spa'].common.localeCompare(b.translations['spa'].common);
      });
      console.log(this.countriesData);
      //this.selectedCountry = this.countriesData.find(c=>c.code === "MX");
      this.countryCodeInput.setValue("MX");
    });
    this.countryCodeInput.valueChanges.subscribe(value=>{
      if(value!==null&&this.countriesData.length>0){
        this.selectedCountry = this.countriesData.find(c=>c.code === value);
        console.log(this.selectedCountry);
      }
    });
  }
  get countryCodeInput():FormControl{
    return this.form.controls['countryCode'] as FormControl;
  }
  roomsHoldersFiltered():HolderData[]{
    return this.roomsHolders.filter((person, index, self) =>
      index === self.findIndex(p => p.name === person.name && p.lastname === person.lastname)
    );
  }
  selectHolder(chip:MatChipListboxChange){
    console.log(chip.value)
    this.selectedHolder = chip.value;
    if(this.selectedHolder !== undefined){
      this.form.controls['name'].setValue(this.selectedHolderData?.name);
      this.form.controls['lastname'].setValue(this.selectedHolderData?.lastname);
    }else{
      this.form.controls['name'].reset();
      this.form.controls['lastname'].reset();
    }
  }
  get selectedHolderData():HolderData|undefined{
    if(this.selectedHolder === undefined){
      return undefined;
    }
    return this.roomsHolders[this.selectedHolder];
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if(this.selectedHolder !== undefined){
      if(this.form.controls['name'].value !== this.selectedHolderData?.name){
        this.form.controls['name'].reset();
        this.form.controls['lastname'].reset();
      }
      if(this.form.controls['lastname'].value !== this.selectedHolderData?.lastname){
        this.form.controls['lastname'].reset();
        this.form.controls['name'].reset();
      }
    }
  }
}

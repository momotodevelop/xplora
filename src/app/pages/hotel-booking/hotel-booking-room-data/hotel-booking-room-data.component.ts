import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AccomodationData } from '../../../types/booking.types';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
export interface HolderData {name:string, lastname: string};
@Component({
  selector: 'app-hotel-booking-room-data',
  imports: [MatInputModule, MatFormFieldModule, ReactiveFormsModule, FormsModule],
  templateUrl: './hotel-booking-room-data.component.html',
  styleUrl: './hotel-booking-room-data.component.scss'
})
export class HotelBookingRoomDataComponent implements OnInit {
  @Input() accomodation!: AccomodationData[];
  @Output() holderData: EventEmitter<HolderData[]> = new EventEmitter();
  form!:FormGroup;
  ngOnInit(): void {
    console.log(this.accomodation);
    const formArray: FormArray = new FormArray(
      this.accomodation.map(()=>{
        return new FormGroup({
          name: new FormControl(null, [Validators.required, Validators.minLength(2)]),
          lastname: new FormControl(null, [Validators.required, Validators.minLength(2)])
        });
      })
    )
    this.form = new FormGroup(
      {
        rooms: formArray
      }
    );
    console.log(this.roomsForm.controls[0]);
    this.roomsForm.valueChanges.subscribe((value:HolderData)=>{
      const validRooms = this.roomsForm.controls
        .filter(control => control.valid)
        .map(control => control.value);
      this.holderData.emit(validRooms);
    });
  }
  get roomsForm():FormArray{
    return this.form.controls['rooms'] as FormArray;
  }
}

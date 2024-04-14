import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatStepperModule} from '@angular/material/stepper';
import { PassengersComponent } from './passengers/passengers.component';
import { BookingSidebarComponent } from './booking-sidebar/booking-sidebar.component';
import { ActivatedRoute } from '@angular/router';
import { XploraApiService } from '../../services/xplora-api.service';
import { XploraFlightBooking } from '../../types/xplora-api.types';
import { SharedDataService } from '../../services/shared-data.service';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AmadeusSeatmapService } from '../../services/amadeus-seatmap.service';
import { FlightOffer } from '../../types/flight-offer-amadeus.types';
import { SeatsComponent } from './seats/seats.component';

@Component({
  selector: 'app-booking-process',
  standalone: true,
  imports: [MatStepperModule, MatFormFieldModule, PassengersComponent, BookingSidebarComponent, TitleCasePipe, MatButtonModule, SeatsComponent],
  templateUrl: './booking-process.component.html',
  styleUrl: './booking-process.component.scss'
})
export class BookingProcessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    private seatMapService: AmadeusSeatmapService
  ){}
  booking?: XploraFlightBooking;
  passengersValid:boolean=false;
  ngOnInit(): void {
    this.sharedService.setLoading(true);
    this.route.params.subscribe((p)=>{
      const params:{bookingID:string, step: string} = p as {bookingID:string, step: string};
      const bookingID:string = params.bookingID;
      const step:string = params.step;
      this.xplora.getBooking(bookingID).subscribe(booking=>{
        console.log(booking);
        this.booking=booking;
        this.sharedService.setLoading(false);
        const flights:FlightOffer[] = [booking.flights.outbound!.offer];
        if(booking.round){
          flights.push(booking.flights.inbound!.offer);
        }
        this.seatMapService.getSeatMap(flights).subscribe(seatMap=>{
          console.log(seatMap);
        })
      });
    });
  }
}

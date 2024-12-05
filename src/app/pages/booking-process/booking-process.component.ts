import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatStepper, MatStepperModule} from '@angular/material/stepper';
import { PassengerValue, PassengersComponent } from './passengers/passengers.component';
import { BookingSidebarComponent } from './booking-sidebar/booking-sidebar.component';
import { ActivatedRoute } from '@angular/router';
import { XploraApiService } from '../../services/xplora-api.service';
import { XploraFlightBooking } from '../../types/xplora-api.types';
import { SharedDataService } from '../../services/shared-data.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AmadeusSeatmapService } from '../../services/amadeus-seatmap.service';
import { FlightOffer } from '../../types/flight-offer-amadeus.types';
import { SeatsComponent } from './seats/seats.component';
import { SeatMap, SeatMapSavingData, SelectedSeat } from '../../types/amadeus-seat-map.types';
import { BookingHandlerService } from '../../services/booking-handler.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import * as _ from 'lodash'
import { ExtrasComponent } from './extras/extras.component';
import { ContactInfoComponent, ContactInfoValue } from './contact-info/contact-info.component';
import { PaymentComponent } from './payment/payment.component';
import { XploraPromosService } from '../../services/xplora-promos.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { GoogleMapsService } from '../../services/google-maps.service'
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { HeaderMapComponent } from '../../shared/header-map/header-map.component';

declare const MercadoPago: any;
declare const ClipSDK: any;

export interface SeatSelectionInfo{
  flight: number,
  airline: string,
  origin: AmadeusLocation,
  destination: AmadeusLocation
}

export type Steps = "PASSENGERS"|"SEATS"|"CONTACT"|"EXTRAS"|"PAYMENT";

@Component({
  selector: 'app-booking-process',
  standalone: true,
  imports: [
    MatStepperModule, 
    MatFormFieldModule, 
    PassengersComponent, 
    BookingSidebarComponent, 
    TitleCasePipe, 
    MatButtonModule, 
    SeatsComponent, 
    ExtrasComponent, 
    ContactInfoComponent, 
    PaymentComponent, 
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FontAwesomeModule,
    HeaderMapComponent
  ],
  templateUrl: './booking-process.component.html',
  styleUrl: './booking-process.component.scss'
})
export class BookingProcessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute, 
    private xplora: XploraApiService, 
    private sharedService: SharedDataService,
    private seatMapService: AmadeusSeatmapService,
    public bookingHandler: BookingHandlerService,
    private promos: XploraPromosService,
    private _sb: MatSnackBar
  ){}
  booking?: XploraFlightBooking;
  bookingID?:string;
  passengers?:PassengerValue[];
  seatMaps!:SeatMap[];
  contactInfo?: ContactInfoValue;
  activePromoCode?:string;
  spinnerIcon=faSpinner;
  nextIcon=faChevronRight;
  loadingProcess:boolean = false;
  passengersStepIcon = 'passengersStepIcon';
  @ViewChild('stepper') stepper!:MatStepper;
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;
  @ViewChild('extras') extras!: ExtrasComponent;
  ngOnInit():void {
    this.sharedService.settBookingMode(true);
    this.route.data.pipe(
      map(data => data["headerType"])
    ).subscribe((type: "light"|"dark") => {
      console.log(type);
      //this.headerType = type;
      this.sharedService.changeHeaderType(type);
    });
    this.sharedService.setLoading(true);
    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q])=>{
      const params:{bookingID:string} = p as {bookingID:string, step: Steps};
      const queryParams:{promo?:string} = q as {promo?:string};
      const bookingID:string = params.bookingID;
      var actualStep:Steps="PASSENGERS";
      this.bookingID = bookingID;
      this.xplora.getBooking(bookingID).subscribe(booking=>{
        console.log(booking);
        this.bookingHandler.setBookingInfo(booking);
        this.sharedService.setLoading(false);
        if(queryParams.promo!==undefined){
          this.getPromo(queryParams.promo);
        }
        if(booking.passengersData!==undefined){
          actualStep="CONTACT";
        }
        if(booking.contact!==undefined){
          actualStep="SEATS";
        }
        if(booking.seatMaps!==undefined){
          actualStep="EXTRAS";
        }
        if(booking.aditionalServices!==undefined){
          actualStep="PAYMENT";
        }
        setTimeout(() => {
          if(this.stepper){
            switch (actualStep) {
              case "CONTACT":
                this.stepper.selectedIndex=1;
                break;
              case "SEATS":
                this.stepper.selectedIndex=2;
                break;
              case "EXTRAS":
                this.stepper.selectedIndex=3;
                break;
              case "PAYMENT":
                this.stepper.selectedIndex=4;
                break;
              default:
                this.goToPassengers();
                break;
            }
          }
        }, 1000);
      });
      this.bookingHandler.booking.subscribe(booking=>{
        if(booking!==undefined){
          this.booking=booking;
        }
      });
    });
  }
  getPromo(promoCode:string){
    this.promos.getPromoByCode(promoCode).subscribe({
      next: promo =>{
        this._sb.open('Promoción '+promo.code+' aplicada.', 'Aceptar', {duration: 1500});
        this.bookingHandler.setPromo(promo);
      },
      error: err =>{
        this.bookingHandler.setPromo(undefined);
        this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
      }
    })
  }
  processPassengers(){
    console.log(this.passengers);
    if(this.passengers!==undefined){
      this.loadingProcess=true;
      let passengersData = this.passengers;
      this.xplora.updateBooking(this.bookingID!, {passengersData:passengersData}).subscribe({
        next:(result=>{
          this.bookingHandler.setBookingInfo(result.booking);
          this.stepper.selectedIndex=1;
          console.log(result);
          this.loadingProcess=false;
        }),
        error:(err=>{
          this.loadingProcess=false;
          this._sb.open('Error al guardar los pasajeros. Intente nuevamente.', 'OK', {duration: 1500});
        })
      });
    }
  }
  openInsuranceFromSidebar(){
    this.stepper.selectedIndex = 3;
    this.extras.openInsurance();
  }
  validContact(event:any){
    console.log(event);
  }
  goToPassengers(){
    this.stepper.selectedIndex=0
  }
  processContact(){
    if(this.contactInfo){
      this.loadingProcess=true;
      this.xplora.updateBooking(this.bookingID!, {contact:this.contactInfo}).subscribe({
        next: (result=>{
          this.bookingHandler.setBookingInfo(result.booking);
          console.log(result);
          this.loadingProcess=false;
          this.stepper.next();
        }),
        error: (err=>{
          this.loadingProcess=false;
        })
      });
    }
  }
  seatsHaveChanges(oldSeatMaps:SeatMapSavingData[], newSeatMaps:SeatMapSavingData[]) {
    let hasChanges = false;
    // Verificar que ambos tengan el mismo número de entradas en seatSelection
    if(oldSeatMaps === undefined) return true;
    if (oldSeatMaps.length !== newSeatMaps.length) return true;
    // Mapear cada seatSelection por passengerID y número de asiento
    oldSeatMaps.forEach((seatMap, seatMapI)=>{
      seatMap.selectedSeats.filter(selection=>selection.seat!==undefined).forEach((selection, selectionI)=>{
        const isDifferent:boolean = newSeatMaps[seatMapI].selectedSeats[selectionI].seat!.number!==selection.seat!.number;
        hasChanges = isDifferent;
      });
    });
    return hasChanges;
  }
  skipStep(step?:Steps){
    if(step==="EXTRAS"||step==="SEATS"){
      switch (step) {
        case "SEATS":
          this.xplora.updateBooking(this.bookingID!, {seatMaps:[]});
          break;
        case "EXTRAS":
          this.xplora.updateBooking(this.bookingID!, {aditionalServices:[]});
          break;
      }
    }
    this.stepper.next();
  }
  processSeats(data:SeatMapSavingData[]){
    const oldSeatMaps = this.booking?.seatMaps;
    if(oldSeatMaps!==undefined){
      const hasChanges:boolean = this.seatsHaveChanges(oldSeatMaps, data);
      console.log(hasChanges);
      if(hasChanges){
        this.xplora.updateBooking(this.bookingID!, {seatMaps:data}).subscribe(updated=>{
          this.stepper.next();
        });
      }else{
        this.stepper.next();
      }
    }else{
      this.xplora.updateBooking(this.bookingID!, {seatMaps:data}).subscribe(updated=>{
        this.stepper.next();
      });
    }
  }

}
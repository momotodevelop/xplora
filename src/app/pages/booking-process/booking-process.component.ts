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
import { ExtrasComponent, ExtrasPrices } from './extras/extras.component';
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
import { FireBookingService } from '../../services/fire-booking.service';
import { FirebaseBooking, FlightFirebaseBooking } from '../../types/booking.types';
import { BookingCreationLoaderComponent, Step } from '../../shared/booking-creation-loader/booking-creation-loader.component';

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
        HeaderMapComponent,
        BookingCreationLoaderComponent
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
    private _sb: MatSnackBar,
    private fireBooking: FireBookingService,
  ){}
  confirmationLoader:boolean=false;
  confirmationLoaderSteps:Step[]=[];
  booking?: FlightFirebaseBooking;
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
    console.log("Inicia componente");
    //this.sharedService.changeHeaderType("dark");
    this.sharedService.settBookingMode(true);
    this.sharedService.setLoading(true);
    combineLatest([this.route.params,this.route.queryParams]).subscribe(([p, q])=>{
      console.log(q);
      console.log(p);
      const params:{bookingID:string} = p as {bookingID:string, step: Steps};
      const bookingID:string = params.bookingID;
      var actualStep:Steps="PASSENGERS";
      this.bookingID = bookingID;
      this.fireBooking.getBooking(bookingID).subscribe(booking=>{
        console.log(booking);
        this.bookingHandler.setBookingInfo(booking as FlightFirebaseBooking);
        this.sharedService.setLoading(false);
        if(q){
          const queryParams:{promo?:string} = q as {promo?:string};
          if(queryParams.promo!==undefined){
            this.getPromo(queryParams.promo);
          }
        }
        if(booking.flightDetails?.passengers.details!==undefined){
          //actualStep="CONTACT";
        }
        if(booking.contact!==undefined){
          actualStep="SEATS";
        }
        if(booking.flightDetails?.seatMaps!==undefined){
          actualStep="EXTRAS";
        }
        if(booking.flightDetails?.aditionalServices!==undefined){
          actualStep="PAYMENT";
        }
        setTimeout(() => {
          if(this.stepper){
            switch (actualStep) {
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
                //this.goToPassengers();
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
        console.log(promo)
        if(promo){
          this._sb.open('Promoción '+promo.code+' aplicada.', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(promo);
        }else{
          this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
          this.bookingHandler.setPromo(undefined);
        }
      },
      error: err =>{
        console.log(err);
        this.bookingHandler.setPromo(undefined);
        this._sb.open('Código de promoción invalido', 'Aceptar', {duration: 1500});
      }
    })
  }
  changePaymentMethod(method:string){
    console.log(method);    
  }
  completeLoader(){

  }
  processPassengers(){
    console.log(this.passengers);
    if(this.passengers!==undefined){
      this.loadingProcess=true;
      const passengersData = this.passengers.map((passenger, i) => {
        return {
          name: passenger.name,
          lastname: passenger.lastname,
          birth: passenger.birth,
          gender: passenger.gender,
          type: passenger.type,
          id: i+1
        }
      });
      let data:Partial<FlightFirebaseBooking> = {
        flightDetails: {
          ...this.booking!.flightDetails!,
          passengers: {
            counts: this.booking!.flightDetails!.passengers.counts,
            details: passengersData
          }
        }
      }
      this.fireBooking.updateBooking(this.bookingID!, data).then((result)=>{
        this.loadingProcess=false;
        this.stepper.next();
        console.log(result);
        this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      }).catch((err)=>{
        console.log(err);
        this.loadingProcess=false;
        this._sb.open('Error al guardar los pasajeros. Intente nuevamente.', 'OK', {duration: 1500});
      });
      if(!this.booking?.flightDetails){
        this.fireBooking.nestedUpdateBooking(this.bookingID!, {
          "flightDetails.aditionalServices": {
            insurance: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'INSURANCE',
                  unitPrice: ExtrasPrices.insurance,
                  active: false
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'INSURANCE',
                  unitPrice: ExtrasPrices.insurance,
                  active: false
                }
              }) : []
            },
            baggage: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'BAGGAGE',
                  unitPrice: ExtrasPrices.baggage,
                  active: false,
                  value: 0
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'BAGGAGE',
                  unitPrice: ExtrasPrices.baggage,
                  active: false,
                  value: 0
                }
              }) : []
            },
            carryOn: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'CARRYON',
                  unitPrice: ExtrasPrices.carryon,
                  active: false,
                  value: 0
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'CARRYON',
                  unitPrice: ExtrasPrices.carryon,
                  active: false,
                  value: 0
                }
              }) : []
            },
            flexpass: {
              outbound: passengersData.map((p,i) => {
                return {
                  scope: "OUTBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'FLEXPASS',
                  unitPrice: ExtrasPrices.flexpass,
                  active: false
                }
              }),
              inbound: this.booking!.flightDetails.round?passengersData.map((p,i) => {
                return {
                  scope: "INBOUND",
                  targetID: i,
                  context: 'FLIGHT',
                  type: 'FLEXPASS',
                  unitPrice: ExtrasPrices.flexpass,
                  active: false
                }
              }) : []
            }
          }
        })
      }
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
      this.fireBooking.updateBooking(this.bookingID!, {
        contact: this.contactInfo
      }).then((result)=>{
        console.log(result);
        this.loadingProcess=false;
        this.stepper.next();
        this.bookingHandler.setBookingInfo(result as FlightFirebaseBooking);
      }).catch((err)=>{
        console.log(err);
        this.loadingProcess=false;
        this._sb.open('Error al guardar los datos de contacto. Intente nuevamente.', 'OK', {duration: 1500});
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
          this.fireBooking.updateBooking(this.bookingID!, {
            flightDetails: {
              ...this.booking!.flightDetails!,
              seatMaps: []
            }
          });
          this.xplora.updateBooking(this.bookingID!, {seatMaps:[]});
          break;
        case "EXTRAS":
          this.fireBooking.updateBooking(this.bookingID!, {
            flightDetails: {
              ...this.booking!.flightDetails!,
              aditionalServices: {

              }
            }
          });
          this.xplora.updateBooking(this.bookingID!, {aditionalServices:[]});
          break;
      }
    }
    this.stepper.next();
  }
  processSeats(data:SeatMapSavingData[]){
    const oldSeatMaps = this.booking?.flightDetails!.seatMaps;
    if(oldSeatMaps!==undefined){
      const hasChanges:boolean = this.seatsHaveChanges(oldSeatMaps, data);
      console.log(hasChanges);
      if(hasChanges){
        this.fireBooking.updateBooking(this.bookingID!, {
          flightDetails: {
            ...this.booking!.flightDetails!,
            seatMaps: data
          }
        }).then(updated=>{
          this.bookingHandler.setBookingInfo(updated as FlightFirebaseBooking);
          this.stepper.next();
        }).catch(err=>{ 
          console.log(err);
          this._sb.open('Error al guardar los asientos seleccionados. Intente nuevamente.', 'OK', {duration: 1500});
        });
      }else{
        this.stepper.next();
      }
    }else{
      this.fireBooking.updateBooking(this.bookingID!, {
        flightDetails: {
          ...this.booking!.flightDetails!,
          seatMaps: data
        }
      }).then(updated=>{
        this.bookingHandler.setBookingInfo(updated as FlightFirebaseBooking);
        this.stepper.next();
      }).catch(err=>{ 
        console.log(err);
        this._sb.open('Error al guardar los asientos seleccionados. Intente nuevamente.', 'OK', {duration: 1500});
      });
    }
  }

}
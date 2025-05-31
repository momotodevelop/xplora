import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectSeatMapBottomsheetComponent } from '../../../shared/select-seat-map-bottomsheet/select-seat-map-bottomsheet.component';
import { Deck, SeatMapSavingData, SeatElement, SeatMap, SelectedSeat } from '../../../types/amadeus-seat-map.types';
import { PassengerValue } from '../passengers/passengers.component';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider'
import { InitialPipe } from '../../../initial.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { XploraFlightBooking } from '../../../types/xplora-api.types';
import { AmadeusSeatmapService } from '../../../services/amadeus-seatmap.service';
import { FlightOffer } from '../../../types/flight-offer-amadeus.types';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FlightBookingDetails } from '../../../types/booking.types';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

export interface SelectionDisplay{
  initial:string,
  seat: string
}

@Component({
    selector: 'app-seats',
    imports: [MatButtonModule, MatIconModule, CommonModule, MatDividerModule, MatIconModule, InitialPipe, MatChipsModule, MatDialogModule, MatProgressSpinnerModule, FontAwesomeModule, MatCardModule, MatListModule],
    providers: [InitialPipe],
    templateUrl: './seats.component.html',
    styleUrl: './seats.component.scss'
})
export class SeatsComponent implements OnInit {
  seatMaps!:SeatMap[];
  passengersData?:PassengerValue[];
  @Output() completed:EventEmitter<SeatMapSavingData[]> = new EventEmitter();
  @Output() pendingSeats:EventEmitter<number> = new EventEmitter();
  @Output() goToPassengers:EventEmitter<void> = new EventEmitter();
  @Output() skip:EventEmitter<void> = new EventEmitter();
  @Output() loading:EventEmitter<boolean> = new EventEmitter();
  selection:SelectedSeat[][]=[];
  seatMapStatus:"LOADING"|"ERROR"|"READY"|"PENDING"|"NOT_PASSENGERS"="PENDING";
  nextIcon=faChevronRight;
  spinnerIcon=faSpinner;
  constructor(private bs: MatBottomSheet, private bookingHandler:BookingHandlerService, private initial: InitialPipe, private dialog: MatDialog, private seatMapService: AmadeusSeatmapService){

  }
  ngOnInit(): void {
    this.loading.emit(true);
    console.log(this.passengersData);
    this.bookingHandler.booking.subscribe((bookingData)=>{
      const booking:FlightBookingDetails = bookingData?.flightDetails as FlightBookingDetails;
      if(booking!==undefined){
        if(booking.passengers.details!==undefined){
          this.passengersData = booking.passengers.details;
          this.seatMapStatus="PENDING";
        }else{
          this.seatMapStatus="NOT_PASSENGERS";
        }
        if(booking.seatMaps!==undefined&&booking.seatMaps.length>0){
          this.selection = [];
          booking.seatMaps.forEach(seatMap=>{
            const seatSelection:SelectedSeat[]=[];
            seatMap.selectedSeats.forEach(passengerSeat=>{
              seatSelection.push({
                passengerID: passengerSeat.passengerID,
                seat: passengerSeat.seat
              });
            })
            this.selection.push(seatSelection);
          });
          this.update();
        }
        const flights:FlightOffer[] = [booking.flights.outbound!.offer];
        if(booking.round){
          flights.push(booking.flights.inbound!.offer);
        }
        console.log(flights);
        this.seatMapStatus = "LOADING";
        this.seatMapService.getSeatMap(flights).subscribe({
          next: (seatMap) => {
            console.log(seatMap.data);
            this.seatMaps = seatMap.data;
            this.seatMaps.forEach((seatMap, index) => {
              if (!this.selection[index]) {
                this.selection[index] = [];
              }
              if (this.passengersData) {
                this.passengersData.forEach((_, i) => {
                  const alreadySelected = this.selection[index].some(sel => sel.passengerID === i);
                  if (!alreadySelected) {
                    this.selection[index].push({
                      passengerID: i
                    });
                  }
                });
              }
            });
            this.seatMapStatus = "READY";
            this.update();
            this.loading.emit(false);
          },
          error: (err) => {
            this.update();
            console.log(err);
            this.seatMapStatus = "ERROR";
            this.loading.emit(false);
            //this.skip.emit();
          }
        })
      }
    });
  }
  update(){
    this.updatePendingSeats();
    this.saveSeatSelection();
  }
  openSeatSelector(deck:Deck, passengerID:number, seatMapID:number, available:number){
    if(available<1){
      this.dialog.open(NoAvailableSeatsDialog, {data: available}).afterClosed().subscribe(result=>{
        if(result) console.log("No available seats");
        this.selection[seatMapID] = this.selection[seatMapID].map(passenger=>{
          return {
            ...passenger,
            seat: {
              cabin: "ECONOMY",
              coordinates: {
                x: 0,
                y: 0
              },
              number: "ND",
              characteristicsCodes: [],
              travelerPricing: []
            }
          }
        });
      })
      return;
    };
    const actualSelecion:SelectionDisplay[]=this.selection[seatMapID].filter(selected=>selected.seat!==undefined).map(selected=>{
      return {
        initial: this.initial.transform(this.passengersData![selected.passengerID].name)+this.initial.transform(this.passengersData![selected.passengerID].lastname),
        seat: selected.seat!.number
      }
    });
    const seatSelector = this.bs.open(SelectSeatMapBottomsheetComponent, {data: {deck, passenger: this.passengersData![passengerID], selected: actualSelecion}, panelClass: 'seat-selector-bottomsheet'});
    seatSelector.afterDismissed().subscribe(result=>{
      if(result!==undefined){
        console.log(result);
        this.selection[seatMapID][passengerID].seat=result as SeatElement;
        console.log(this.selection);
        this.update();
      }
    })
  }
  removedSeat(seatMapI:number, passengerI:number){
    this.selection[seatMapI][passengerI].seat = undefined;
    this.update();
  }
  getSavingData():SeatMapSavingData[]{
    const SavingData:SeatMapSavingData[] = []
    if(this.seatMaps){
      this.seatMaps.forEach((seatMap,i)=>{
        SavingData.push({
          aircraft: seatMap.aircraft,
          aircraftCabinAmenities: seatMap.aircraftCabinAmenities,
          arrival: seatMap.arrival,
          departure: seatMap.departure,
          segmentId: seatMap.segmentId,
          carrierCode: seatMap.carrierCode,
          id: seatMap.id,
          number: seatMap.number,
          operating: seatMap.operating,
          selectedSeats: this.selection[i]
        });
      });
    }
    return SavingData;
  }
  updatePendingSeats(){
    const pendingSelectionSeats=this.selection.filter(passenger=>passenger.filter(pass=>pass.seat===undefined).length>0).length;
    console.log(pendingSelectionSeats)
    this.pendingSeats.emit(pendingSelectionSeats);
  }
  saveSeatSelection(){
    this.completed.emit(this.getSavingData());
  }
  flightHasSeatMap(carrierCode:string, number:string):boolean{
    return this.seatMaps.some(seatMap=> (seatMap.operating?.carrierCode ?? seatMap.carrierCode === carrierCode)&&seatMap.number===number)
  }
}
@Component({
    selector: 'pending-seats-dialog',
    imports: [MatDialogModule, MatButtonModule],
    providers: [],
    templateUrl: './pending-seats-dialog.component.html'
})
export class SeatPendingDialog{
  constructor(@Inject(MAT_DIALOG_DATA) public data: number){

  }
}

@Component({
  selector: 'no-available-seats-dialog',
  imports: [MatDialogModule, MatButtonModule],
  providers: [],
  templateUrl: './no-available-seats-dialog.component.html'
})
export class NoAvailableSeatsDialog{
  constructor(@Inject(MAT_DIALOG_DATA) public data: number){

  }
}
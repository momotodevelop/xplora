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

export interface SelectionDisplay{
  initial:string,
  seat: string
}

@Component({
  selector: 'app-seats',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, CommonModule, MatDividerModule, MatIconModule, InitialPipe, MatChipsModule, MatDialogModule, MatProgressSpinnerModule, FontAwesomeModule],
  providers: [InitialPipe],
  templateUrl: './seats.component.html',
  styleUrl: './seats.component.scss'
})
export class SeatsComponent implements OnInit {
  seatMaps!:SeatMap[];
  passengersData?:PassengerValue[];
  @Output() completed:EventEmitter<SeatMapSavingData[]> = new EventEmitter();
  @Output() goToPassengers:EventEmitter<void> = new EventEmitter();
  @Output() skip:EventEmitter<void> = new EventEmitter();
  selection:SelectedSeat[][]=[];
  seatMapStatus:"LOADING"|"ERROR"|"READY"|"PENDING"|"NOT_PASSENGERS"="PENDING";
  nextIcon=faChevronRight;
  spinnerIcon=faSpinner;
  loading:boolean=false;
  constructor(private bs: MatBottomSheet, private bookingHandler:BookingHandlerService, private initial: InitialPipe, private dialog: MatDialog, private seatMapService: AmadeusSeatmapService){

  }
  ngOnInit(): void {
    console.log(this.passengersData);
    this.bookingHandler.booking.subscribe((booking)=>{
      if(booking!==undefined){
        if(booking.passengersData!==undefined){
          this.passengersData = booking.passengersData;
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
            this.seatMaps.forEach(seatMap=>{
              const seatMapSelection:SelectedSeat[]=[]
              if(this.passengersData){
                this.passengersData.forEach((passenger,i)=>{
                  seatMapSelection.push({
                    passengerID: i
                  });
                });
              }
              this.selection.push(seatMapSelection);
            });
            this.seatMapStatus = "READY";
          },
          error: (err) => {
            console.log(err);
            this.seatMapStatus = "ERROR";
          }
        })
      }
    });
  }
  openSeatSelector(deck:Deck, passengerID:number, seatMapID:number){
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
      }
    })
  }
  removedSeat(seatMapI:number, passengerI:number){
    this.selection[seatMapI][passengerI].seat = undefined;
  }
  getSavingData():SeatMapSavingData[]{
    const SavingData:SeatMapSavingData[] = []
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
    return SavingData;
  }
  saveSeatSelection(){
    const pendingSelectionSeats=this.selection.filter(passenger=>passenger.filter(pass=>pass.seat===undefined).length>0).length;
    this.loading=true;
    if(pendingSelectionSeats>0){
      this.dialog.open(SeatPendingDialog, {data: pendingSelectionSeats}).afterClosed().subscribe(result=>{
        if(result) this.completed.emit(this.getSavingData());
      })
    }else{
      this.completed.emit(this.getSavingData());
    }
  }
  flightHasSeatMap(carrierCode:string, number:string):boolean{
    return this.seatMaps.some(seatMap=> (seatMap.operating?.carrierCode ?? seatMap.carrierCode === carrierCode)&&seatMap.number===number)
  }
}
@Component({
  selector: 'pending-seats-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  providers: [],
  templateUrl: './pending-seats-dialog.component.html'
})
export class SeatPendingDialog{
  constructor(@Inject(MAT_DIALOG_DATA) public data: number){

  }
}
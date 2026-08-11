import { Component, EventEmitter, Inject, OnInit, Output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SelectSeatMapBottomsheetComponent } from '../../../shared/select-seat-map-bottomsheet/select-seat-map-bottomsheet.component';
import { SeatMapSavingData, SeatElement, SeatMap, SelectedSeat, TravelerPricing } from '../../../types/amadeus-seat-map.types';
import { PassengerValue } from '../passengers/passengers.component';
import { BookingHandlerService } from '../../../services/booking-handler.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider'
import { InitialPipe } from '../../../initial.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AmadeusSeatmapService } from '../../../services/amadeus-seatmap.service';
import { FlightOffer } from '../../../types/flight-offer-amadeus.types';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FlightBookingDetails, FlightFirebaseBooking } from '../../../types/booking.types';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { filter, take } from 'rxjs';

export interface SelectionDisplay{
  initial:string,
  seat: string
}

@Component({
    selector: 'app-seats',
    imports: [MatButtonModule, MatIconModule, CommonModule, MatDividerModule, MatIconModule, MatChipsModule, MatDialogModule, MatProgressSpinnerModule, FontAwesomeModule, MatCardModule, MatListModule],
    providers: [InitialPipe],
    templateUrl: './seats.component.html',
    styleUrl: './seats.component.scss'
})
export class SeatsComponent implements OnInit {
  seatMaps:SeatMap[]=[];
  passengersData?:PassengerValue[];
  @Output() completed:EventEmitter<SeatMapSavingData[]> = new EventEmitter();
  @Output() pendingSeats:EventEmitter<number> = new EventEmitter();
  @Output() goToPassengers:EventEmitter<void> = new EventEmitter();
  @Output() skip:EventEmitter<void> = new EventEmitter();
  @Output() loading:EventEmitter<boolean> = new EventEmitter();
  selection:SelectedSeat[][]=[];
  private flights: FlightOffer[] = [];
  private savedSeatMaps: SeatMapSavingData[] = [];
  seatMapStatus:"LOADING"|"ERROR"|"READY"|"PENDING"|"NOT_PASSENGERS"|"UNAVAILABLE"="PENDING";
  nextIcon=faChevronRight;
  spinnerIcon=faSpinner;
  constructor(private bs: MatBottomSheet, private bookingHandler:BookingHandlerService, private initial: InitialPipe, private dialog: MatDialog, private seatMapService: AmadeusSeatmapService){

  }
  ngOnInit(): void {
    this.loading.emit(true);
    this.bookingHandler.booking.pipe(
      filter((bookingData): bookingData is FlightFirebaseBooking => bookingData !== undefined),
      take(1)
    ).subscribe((bookingData)=>{
      const booking:FlightBookingDetails = bookingData?.flightDetails as FlightBookingDetails;
      if(booking!==undefined){
        if(booking.passengers.details===undefined){
          this.seatMapStatus="NOT_PASSENGERS";
          this.loading.emit(false);
          return;
        }
        this.passengersData = booking.passengers.details;
        this.savedSeatMaps = booking.seatMaps ?? [];
        this.seatMapStatus="PENDING";

        const flights:FlightOffer[] = [booking.flights.outbound!.offer];
        if(booking.round){
          flights.push(booking.flights.inbound!.offer);
        }
        this.flights = flights;
        this.seatMapStatus = "LOADING";
        this.seatMapService.getSeatMap(flights).subscribe({
          next: (seatMap) => {
            this.seatMaps = seatMap.data;
            if (!this.seatMaps.length) {
              this.selection = [];
              this.seatMapStatus = "UNAVAILABLE";
              this.update();
              this.loading.emit(false);
              return;
            }
            this.initializeSelections();
            this.seatMapStatus = "READY";
            this.update();
            this.loading.emit(false);
          },
          error: (err) => {
            this.update();
            //console.log(err);
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
  openSeatSelector(seatMapID:number, passengerID:number){
    const seatMap = this.seatMaps[seatMapID];
    const available = this.getAvailableSeatsCount(seatMap, passengerID);
    if(available<1){
      this.dialog.open(NoAvailableSeatsDialog, {data: available});
      return;
    };
    const actualSelecion:SelectionDisplay[]=this.selection[seatMapID].filter(selected=>selected.seat!==undefined).map(selected=>{
      return {
        initial: this.initial.transform(this.passengersData![selected.passengerID].name)+this.initial.transform(this.passengersData![selected.passengerID].lastname),
        seat: selected.seat!.number
      }
    });
    const travelerId = this.getTravelerIdForSeatMap(seatMapID, passengerID);
    const seatSelector = this.bs.open(SelectSeatMapBottomsheetComponent, {
      data: {
        decks: seatMap.decks,
        passenger: this.passengersData![passengerID],
        selected: actualSelecion,
        travelerId
      },
      panelClass: 'seat-selector-bottomsheet'
    });
    seatSelector.afterDismissed().subscribe(result=>{
      if(result!==undefined){
        const seat = result as SeatElement;
        const pricing = this.getTravelerPricing(seat, travelerId);
        this.selection[seatMapID][passengerID] = {
          passengerID,
          seat,
          travelerId,
          serviceId: pricing?.serviceId
        };
        this.update();
      }
    })
  }
  removedSeat(seatMapI:number, passengerI:number){
    this.selection[seatMapI][passengerI] = {
      passengerID: passengerI,
      travelerId: this.getTravelerIdForSeatMap(seatMapI, passengerI)
    };
    this.update();
  }

  getAvailableSeatsCount(seatMap: SeatMap, passengerIndex: number): number {
    const travelerId = this.getTravelerId(seatMap, passengerIndex);
    if (travelerId) {
      return seatMap.availableSeatsCounters.find(counter => counter.travelerId === travelerId)?.value ?? 0;
    }
    return seatMap.provider === 'DUFFEL'
      ? 0
      : seatMap.availableSeatsCounters.find(counter => counter.travelerId === 'all')?.value ?? 0;
  }

  passengerRequiresSeat(passengerIndex: number): boolean {
    const passenger = this.passengersData?.[passengerIndex];
    if (passenger?.type === 'INFANT') return false;
    return !this.flights.some(flight =>
      flight.travelerPricings?.[passengerIndex]?.travelerType === 'INFANT_WITHOUT_SEAT'
    );
  }

  private getTravelerIdForSeatMap(seatMapIndex: number, passengerIndex: number): string | undefined {
    const seatMap = this.seatMaps?.[seatMapIndex];
    return seatMap ? this.getTravelerId(seatMap, passengerIndex) : undefined;
  }

  private getTravelerId(seatMap: SeatMap, passengerIndex: number): string | undefined {
    const offer = this.flights.find(flight => flight.id === seatMap?.flightOfferId);
    return offer?.travelerPricings?.[passengerIndex]?.travelerId;
  }

  private getTravelerPricing(seat: SeatElement, travelerId?: string): TravelerPricing | undefined {
    const exactPricing = travelerId
      ? seat.travelerPricing.find(price => price.travelerId === travelerId)
      : undefined;
    if (exactPricing) return exactPricing;
    const sharedPricing = seat.travelerPricing.find(price => price.travelerId === 'all');
    if (sharedPricing) return sharedPricing;
    return seat.provider === 'DUFFEL' ? undefined : seat.travelerPricing[0];
  }

  private initializeSelections(): void {
    this.selection = this.seatMaps.map(seatMap => {
      const savedMap = this.savedSeatMaps.find(saved =>
        saved.segmentId === seatMap.segmentId || saved.id === seatMap.id
      );
      return (this.passengersData ?? []).map((_, passengerIndex) => {
        const travelerId = this.getTravelerId(seatMap, passengerIndex);
        if (!this.passengerRequiresSeat(passengerIndex)) {
          return {
            passengerID: passengerIndex,
            travelerId,
            status: 'NOT_REQUIRED'
          };
        }

        const availableSeats = this.getAvailableSeatsCount(seatMap, passengerIndex);
        const savedSelection = savedMap?.selectedSeats.find(selected =>
          selected.passengerID === passengerIndex
        );
        if (savedSelection?.seat?.number && savedSelection.seat.number !== 'ND') {
          const currentSeat = seatMap.decks
            .flatMap(deck => deck.seats)
            .find(seat => seat.number === savedSelection.seat?.number);
          const pricing = currentSeat
            ? this.getTravelerPricing(currentSeat, travelerId)
            : undefined;
          if (currentSeat && pricing?.seatAvailabilityStatus === 'AVAILABLE') {
            return {
              passengerID: passengerIndex,
              travelerId,
              serviceId: pricing.serviceId,
              seat: currentSeat
            };
          }
        }

        if (availableSeats < 1) {
          return {
            passengerID: passengerIndex,
            travelerId,
            status: 'NOT_AVAILABLE'
          };
        }
        return {passengerID: passengerIndex, travelerId};
      });
    });
  }

  getSavingData():SeatMapSavingData[]{
    const savingData:SeatMapSavingData[] = []
    if(this.seatMaps){
      this.seatMaps.forEach((seatMap,i)=>{
        savingData.push({
          aircraft: seatMap.aircraft,
          aircraftCabinAmenities: seatMap.aircraftCabinAmenities,
          arrival: seatMap.arrival,
          departure: seatMap.departure,
          segmentId: seatMap.segmentId,
          carrierCode: seatMap.carrierCode,
          id: seatMap.id,
          number: seatMap.number,
          operating: seatMap.operating,
          provider: seatMap.provider,
          flightOfferId: seatMap.flightOfferId,
          sliceId: seatMap.sliceId,
          selectedSeats: this.selection[i]
        });
      });
    }
    return this.removeUndefinedValues(savingData);
  }
  private removeUndefinedValues<T>(value: T): T {
    if(Array.isArray(value)){
      return value
        .filter(item => item !== undefined)
        .map(item => this.removeUndefinedValues(item)) as T;
    }
    if(value instanceof Date){
      return value;
    }
    if(value !== null && typeof value === 'object'){
      const prototype = Object.getPrototypeOf(value);
      if(prototype !== Object.prototype && prototype !== null){
        return value;
      }
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .map(([key, item]) => [key, this.removeUndefinedValues(item)])
      ) as T;
    }
    return value;
  }
  updatePendingSeats(){
    const pendingSelectionSeats = this.selection
      .flat()
      .filter(selection => selection.seat === undefined && selection.status === undefined)
      .length;
    this.pendingSeats.emit(pendingSelectionSeats);
  }
  saveSeatSelection(){
    this.completed.emit(this.getSavingData());
  }
  flightHasSeatMap(carrierCode:string, number:string):boolean{
    return this.seatMaps.some(seatMap =>
      (seatMap.operating?.carrierCode ?? seatMap.carrierCode) === carrierCode
      && seatMap.number === number
    );
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

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Deck, SeatElement } from '../../types/amadeus-seat-map.types';
import { Row } from '../../services/amadeus-seatmap.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { PassengerValue } from '../../pages/booking-process/passengers/passengers.component';
import { InitialPipe } from '../../initial.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionDisplay } from '../../pages/booking-process/seats/seats.component';

@Component({
    selector: 'app-select-seat-map',
    imports: [MatGridListModule, CommonModule, InitialPipe, MatSnackBarModule],
    templateUrl: './select-seat-map.component.html',
    styleUrl: './select-seat-map.component.scss'
})
export class SelectSeatMapComponent implements OnInit {
  @Input() deck!:Deck;
  rows: Row[] = [];
  selectedSeat?:SeatElement;
  @Input() selection!:SelectionDisplay[];
  @Input() passenger!:PassengerValue;
  @Output() selected: EventEmitter<SeatElement> = new EventEmitter();
  ngOnInit(): void {
    this.mapDeckToRows(this.deck);
    console.log(this.rows);
    console.log(this.deck);
    console.log(this.selection);
  }
  constructor(private sb: MatSnackBar){}
  mapDeckToRows(deck: Deck): void {
    const { width, startSeatRow, endSeatRow, startWingsRow, endWingsRow, exitRowsX } = deck.deckConfiguration;

    // Inicializa las filas con todos los espacios como pasillo
    for (let rowNum = startSeatRow; rowNum <= endSeatRow; rowNum++) {
      const row: Row = {
        number: rowNum,
        wingStatus: this.getWingStatus(rowNum, startWingsRow, endWingsRow),
        exitRow: exitRowsX ? exitRowsX.includes(rowNum) : false,
        items: Array.from({ length: width }, () => ({ type: 'AISLE' }))
      };
      this.rows.push(row);
    }

    // Asigna los asientos a los items correspondientes y crea espacios de pasillo donde no hay asientos
    deck.seats.forEach((seat: SeatElement) => {
      const rowNum = this.getSeatRowNumber(seat.number);
      const row = this.rows.find(r => r.number === rowNum);
      if (row) {
        row.items[seat.coordinates.y] = { type: 'SEAT', seat: seat };
      }
    });

    // Completar los items de tipo 'AISLE' donde no hay asientos definidos
    this.rows.forEach(row => {
      for (let i = 0; i < width; i++) {
        if (!row.items[i] || row.items[i].type !== 'SEAT') {
          row.items[i] = { type: 'AISLE' }; // Identifica el pasillo dinámicamente
        }
      }
    });
  }

  getWingStatus(rowNum: number, startWingsRow: number, endWingsRow: number): 'START' | 'END' | 'HAS_WING' | 'NONE' {
    if (rowNum === startWingsRow) return 'START';
    if (rowNum === endWingsRow) return 'END';
    if (rowNum > startWingsRow && rowNum < endWingsRow) return 'HAS_WING';
    return 'NONE';
  }

  isSelected(seatNumber:string){
    return this.selection.some(selected=> selected.seat===seatNumber);
  }

  passengerInitial(seatNumber:string):string{
    return this.selection.find(selected => selected.seat===seatNumber)?.initial ?? '';
  }

  getSeatRowNumber(seatNumber: string): number {
    // Extrae el número de la fila del número del asiento (p. ej., "6A" => 6).
    const match = seatNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : -1;
  }
  selectSeat(seat:SeatElement, selected:boolean=false){
    if(seat.travelerPricing[0].seatAvailabilityStatus==="AVAILABLE"&&!selected){
      this.selectedSeat = seat;
      this.selected.emit(seat);
    }else{
      this.sb.open('Asiento '+seat.number+' no disponible', 'Aceptar', {horizontalPosition: 'start', verticalPosition: 'top', duration: 1500});
    }
  }
}

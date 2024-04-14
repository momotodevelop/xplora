import { Component, Input, OnInit } from '@angular/core';
import { Deck } from '../../types/amadeus-seat-map.types';
import { Row } from '../../services/amadeus-seatmap.service';

@Component({
  selector: 'app-select-seat-map',
  standalone: true,
  imports: [],
  templateUrl: './select-seat-map.component.html',
  styleUrl: './select-seat-map.component.scss'
})
export class SelectSeatMapComponent implements OnInit {
  @Input() deck!:Deck;
  rows: Row[] = [];
  ngOnInit(): void {
    this.mapDeckToRows(this.deck);
    console.log(this.deck);
  }
  constructor(){}
  mapDeckToRows(deck: any): void {
    // Asumiendo que el objeto deck es el que proporcionaste en el ejemplo.
    const { width, length, startSeatRow, endSeatRow, startWingsX, endWingsX, startWingsRow, endWingsRow, exitRowsX } = deck.deckConfiguration;
    
    // Inicializa las filas
    for (let rowNum = startSeatRow; rowNum <= endSeatRow; rowNum++) {
      const row: Row = {
        number: rowNum,
        wingStatus: this.getWingStatus(rowNum, startWingsRow, endWingsRow),
        exitRow: exitRowsX.includes(rowNum),
        seats: []
      };
      this.rows.push(row);
    }

    // Asigna los asientos a las filas correspondientes
    for (const seat of deck.seats) {
      const seatRowNumber = this.getSeatRowNumber(seat.number); // Implementa esta función según el formato del número de asiento.
      const row = this.rows.find(r => r.number === seatRowNumber);
      if (row) {
        row.seats.push(seat);
      }
    }

    // Ordena los asientos en la fila por su posición en X.
    this.rows.forEach(row => {
      row.seats.sort((a, b) => a.coordinates.x - b.coordinates.x);
    });
  }

  getWingStatus(rowNum: number, startWingsRow: number, endWingsRow: number): 'START' | 'END' | 'HAS_WING' | 'NONE' {
    if (rowNum === startWingsRow) return 'START';
    if (rowNum === endWingsRow) return 'END';
    if (rowNum > startWingsRow && rowNum < endWingsRow) return 'HAS_WING';
    return 'NONE';
  }

  getSeatRowNumber(seatNumber: string): number {
    // Extrae el número de la fila del número del asiento (p. ej., "6A" => 6).
    const match = seatNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : -1;
  }
}

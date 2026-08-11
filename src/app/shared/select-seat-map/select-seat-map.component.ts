import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Deck, SeatElement, SeatMapLayoutElement, TravelerPricing } from '../../types/amadeus-seat-map.types';
import { Row } from '../../services/amadeus-seatmap.service';
import { MatGridListModule } from '@angular/material/grid-list';
import { CommonModule } from '@angular/common';
import { PassengerValue } from '../../pages/booking-process/passengers/passengers.component';
import { InitialPipe } from '../../initial.pipe';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionDisplay } from '../../pages/booking-process/seats/seats.component';
import { MatIconModule } from '@angular/material/icon';

interface RenderedDeck {
  deck: Deck;
  rows: Row[];
}

@Component({
    selector: 'app-select-seat-map',
    imports: [MatGridListModule, CommonModule, InitialPipe, MatSnackBarModule, MatIconModule],
    templateUrl: './select-seat-map.component.html',
    styleUrl: './select-seat-map.component.scss'
})
export class SelectSeatMapComponent implements OnInit {
  @Input() decks: Deck[] = [];
  renderedDecks: RenderedDeck[] = [];
  selectedSeat?:SeatElement;
  @Input() selection!:SelectionDisplay[];
  @Input() passenger!:PassengerValue;
  @Input() travelerId?: string;
  @Output() selected: EventEmitter<SeatElement> = new EventEmitter();
  ngOnInit(): void {
    this.renderedDecks = this.decks.map(deck => ({
      deck,
      rows: deck.layoutRows?.length ? [] : this.mapDeckToRows(deck)
    }));
  }
  constructor(private sb: MatSnackBar){}
  mapDeckToRows(deck: Deck): Row[] {
    const rows: Row[] = [];
    const { width, startSeatRow, endSeatRow, startWingsRow, endWingsRow, exitRowsX } = deck.deckConfiguration;

    // Inicializa las filas con todos los espacios como pasillo
    for (let rowNum = startSeatRow; rowNum <= endSeatRow; rowNum++) {
      const row: Row = {
        number: rowNum,
        wingStatus: this.getWingStatus(rowNum, startWingsRow, endWingsRow),
        exitRow: exitRowsX ? exitRowsX.includes(rowNum) : false,
        items: Array.from({ length: width }, () => ({ type: 'AISLE' }))
      };
      rows.push(row);
    }

    // Asigna los asientos a los items correspondientes y crea espacios de pasillo donde no hay asientos
    deck.seats.forEach((seat: SeatElement) => {
      const rowNum = this.getSeatRowNumber(seat.number);
      const row = rows.find(r => r.number === rowNum);
      if (row) {
        row.items[seat.coordinates.x] = { type: 'SEAT', seat: seat };
      }
    });

    // Completar los items de tipo 'AISLE' donde no hay asientos definidos
    rows.forEach(row => {
      for (let i = 0; i < width; i++) {
        if (!row.items[i] || row.items[i].type !== 'SEAT') {
          row.items[i] = { type: 'AISLE' }; // Identifica el pasillo dinámicamente
        }
      }
    });
    return rows;
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

  getTravelerPricing(seat: SeatElement): TravelerPricing | undefined {
    const exactPricing = this.travelerId
      ? seat.travelerPricing.find(price => price.travelerId === this.travelerId)
      : undefined;
    if (exactPricing) return exactPricing;

    const sharedPricing = seat.travelerPricing.find(price => price.travelerId === 'all');
    if (sharedPricing) return sharedPricing;

    // Duffel creates one service per passenger. Falling back to another
    // passenger's service would reserve the seat for the wrong person.
    return seat.provider === 'DUFFEL' ? undefined : seat.travelerPricing[0];
  }

  isSeatAvailable(seat: SeatElement): boolean {
    return this.getTravelerPricing(seat)?.seatAvailabilityStatus === 'AVAILABLE';
  }

  getSeatRowNumber(seatNumber: string): number {
    // Extrae el número de la fila del número del asiento (p. ej., "6A" => 6).
    const match = seatNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : -1;
  }

  elementIcon(element: SeatMapLayoutElement): string {
    switch (element.type) {
      case 'lavatory':
        return 'wc';
      case 'galley':
        return 'restaurant';
      case 'bassinet':
        return 'child_friendly';
      case 'exit_row':
        return 'exit_to_app';
      default:
        return 'info';
    }
  }

  elementLabel(element: SeatMapLayoutElement): string {
    if (element.name) return element.name;
    switch (element.type) {
      case 'lavatory':
        return 'Baño';
      case 'galley':
        return 'Cocina';
      case 'bassinet':
        return 'Cuna';
      case 'exit_row':
        return 'Salida';
      default:
        return element.type.replaceAll('_', ' ');
    }
  }

  seatTooltip(seat: SeatElement): string {
    return [seat.name, ...(seat.disclosures ?? [])].filter(Boolean).join(' · ');
  }

  selectSeat(seat:SeatElement, selected:boolean=false){
    if(this.isSeatAvailable(seat)&&!selected){
      this.selectedSeat = seat;
      this.selected.emit(seat);
    }else{
      this.sb.open('Asiento '+seat.number+' no disponible', 'Aceptar', {horizontalPosition: 'start', verticalPosition: 'top', duration: 1500});
    }
  }
}

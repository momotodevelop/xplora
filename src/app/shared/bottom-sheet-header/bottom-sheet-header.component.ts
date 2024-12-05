import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bottom-sheet-header',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './bottom-sheet-header.component.html',
  styleUrls: ['./bottom-sheet-header.component.scss']
})
export class BottomSheetHeaderComponent {
  // Input para recibir el texto del título
  @Input() title: string = '';

  // Output para emitir el evento de cierre
  @Output() close: EventEmitter<void> = new EventEmitter<void>();

  // Método para emitir el evento de cierre
  onClose() {
    this.close.emit();
  }
}
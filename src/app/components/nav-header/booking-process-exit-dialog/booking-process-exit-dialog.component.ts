import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-booking-process-exit-dialog',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './booking-process-exit-dialog.component.html',
  styleUrl: './booking-process-exit-dialog.component.scss'
})
export class BookingProcessExitDialogComponent {

}

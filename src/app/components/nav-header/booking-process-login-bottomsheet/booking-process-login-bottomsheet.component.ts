import { Component, inject } from '@angular/core';
import { LoginComponent } from '../../../shared/login/login.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-booking-process-login-bottomsheet',
  imports: [LoginComponent],
  templateUrl: './booking-process-login-bottomsheet.component.html',
  styleUrl: './booking-process-login-bottomsheet.component.scss'
})
export class BookingProcessLoginBottomsheetComponent {
  private _bottomSheetRef = inject<MatBottomSheetRef<BookingProcessLoginBottomsheetComponent>>(MatBottomSheetRef);
  close() {
    this._bottomSheetRef.dismiss();
  }
}

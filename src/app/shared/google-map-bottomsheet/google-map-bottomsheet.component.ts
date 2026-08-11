import { Component, Inject } from '@angular/core';
import { GoogleMapComponent } from '../google-map/google-map.component';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
  selector: 'app-google-map-bottomsheet',
  imports: [GoogleMapComponent, XploraBottomSheetComponent],
  templateUrl: './google-map-bottomsheet.component.html',
  styleUrl: './google-map-bottomsheet.component.scss'
})
export class GoogleMapBottomsheetComponent {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: {lat:number, lng:number, name: string},
  private ref: MatBottomSheetRef<GoogleMapBottomsheetComponent>
  ){}
  close(){
    this.ref.dismiss();
  }
}

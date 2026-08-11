import { Component } from '@angular/core';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-xplorai-smartfare',
  imports: [XploraBottomSheetComponent],
  templateUrl: './xplorai-smartfare.component.html',
  styleUrl: './xplorai-smartfare.component.scss'
})
export class XploraiSmartfareComponent {
  constructor(private _ref:MatBottomSheetRef<XploraiSmartfareComponent>){}
  close(){
    this._ref.dismiss();
  }
}

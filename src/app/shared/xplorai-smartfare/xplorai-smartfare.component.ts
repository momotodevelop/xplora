import { Component } from '@angular/core';
import { BottomSheetHeaderComponent } from '../bottom-sheet-header/bottom-sheet-header.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-xplorai-smartfare',
  imports: [BottomSheetHeaderComponent],
  templateUrl: './xplorai-smartfare.component.html',
  styleUrl: './xplorai-smartfare.component.scss'
})
export class XploraiSmartfareComponent {
  constructor(private _ref:MatBottomSheetRef<XploraiSmartfareComponent>){}
  close(){
    this._ref.dismiss();
  }
}

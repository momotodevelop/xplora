import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { XploraBottomSheetComponent } from '../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-tripadvisor',
    imports: [XploraBottomSheetComponent],
    templateUrl: './tripadvisor.component.html',
    styleUrl: './tripadvisor.component.scss'
})
export class TripadvisorComponent {
    constructor(private _ref: MatBottomSheetRef){}
    close(){this._ref.dismiss()}
}

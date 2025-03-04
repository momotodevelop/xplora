import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BottomSheetHeaderComponent } from '../../../shared/bottom-sheet-header/bottom-sheet-header.component';

@Component({
    selector: 'app-tripadvisor',
    imports: [BottomSheetHeaderComponent],
    templateUrl: './tripadvisor.component.html',
    styleUrl: './tripadvisor.component.scss'
})
export class TripadvisorComponent {
    constructor(private _ref: MatBottomSheetRef){}
    close(){this._ref.dismiss()}
}

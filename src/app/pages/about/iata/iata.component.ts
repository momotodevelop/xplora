import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSliderModule } from '@angular/material/slider';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { BottomSheetHeaderComponent } from '../../../shared/bottom-sheet-header/bottom-sheet-header.component';

@Component({
    selector: 'app-iata',
    imports: [NgxExtendedPdfViewerModule, BottomSheetHeaderComponent, MatSliderModule],
    templateUrl: './iata.component.html',
    styleUrl: './iata.component.scss'
})
export class IataComponent {
    zoom=20;
    src="/assets/docs/IATA-Xplora.pdf"
    constructor(private _ref:MatBottomSheetRef<IataComponent>){}
    close(){
        this._ref.dismiss();
    }
    setZoom(zoom:number){
        console.log(zoom);
        this.zoom=zoom;
    }
}

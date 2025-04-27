import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSliderModule } from '@angular/material/slider';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { BottomSheetHeaderComponent } from '../../../shared/bottom-sheet-header/bottom-sheet-header.component';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

@Component({
    selector: 'app-amav',
    imports: [NgxExtendedPdfViewerModule, BottomSheetHeaderComponent, MatSliderModule],
    templateUrl: './amav.component.html',
    styleUrl: './amav.component.scss'
})
export class AmavComponent {
    zoom=50;
    src="/assets/docs/AMAV-Xplora.pdf"
    constructor(private _ref:MatBottomSheetRef<AmavComponent>){
        pdfDefaultOptions.workerSrc = ()=>'./pdf.worker-4.7.728.min.mjs';
    }
    close(){
        this._ref.dismiss();
    }
    setZoom(zoom:number){
        console.log(zoom);
        this.zoom=zoom;
    }
}

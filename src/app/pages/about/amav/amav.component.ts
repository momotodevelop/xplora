import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSliderModule } from '@angular/material/slider';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { XploraBottomSheetComponent } from '../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';
import { pdfDefaultOptions } from 'ngx-extended-pdf-viewer';

@Component({
    selector: 'app-amav',
    imports: [NgxExtendedPdfViewerModule, XploraBottomSheetComponent, MatSliderModule],
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
        this.zoom=zoom;
    }
}

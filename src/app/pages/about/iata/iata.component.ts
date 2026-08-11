import { Component } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatSliderModule } from '@angular/material/slider';
import { NgxExtendedPdfViewerModule, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { XploraBottomSheetComponent } from '../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
    selector: 'app-iata',
    imports: [NgxExtendedPdfViewerModule, XploraBottomSheetComponent, MatSliderModule],
    templateUrl: './iata.component.html',
    styleUrl: './iata.component.scss'
})
export class IataComponent {
    zoom=20;
    src="/assets/docs/IATA-Xplora.pdf"
    constructor(private _ref:MatBottomSheetRef<IataComponent>){
        pdfDefaultOptions.workerSrc = ()=>'./pdf.worker-4.7.728.min.mjs';
    }
    close(){
        this._ref.dismiss();
    }
    setZoom(zoom:number){
        this.zoom=zoom;
    }
}

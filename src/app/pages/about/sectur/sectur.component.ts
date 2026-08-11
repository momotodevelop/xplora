import { Component } from '@angular/core';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService, pdfDefaultOptions } from 'ngx-extended-pdf-viewer';
import { XploraBottomSheetComponent } from '../../../shared/xplora-bottom-sheet/xplora-bottom-sheet.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
    selector: 'app-sectur',
    imports: [NgxExtendedPdfViewerModule, XploraBottomSheetComponent, MatSliderModule],
    providers: [NgxExtendedPdfViewerService],
    templateUrl: './sectur.component.html',
    styleUrl: './sectur.component.scss'
})
export class SecturComponent {
  zoom=50;
  src="/assets/docs/04230055f32e1-cert-sm.pdf"
  constructor(private _ref:MatBottomSheetRef<SecturComponent>){
    pdfDefaultOptions.workerSrc = ()=>'./pdf.worker-4.7.728.min.mjs';
  }
  close(){
    this._ref.dismiss();
  }
  setZoom(zoom:number){
    this.zoom=zoom;
  }
}

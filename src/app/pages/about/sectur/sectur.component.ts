import { Component } from '@angular/core';
import { NgxExtendedPdfViewerModule, NgxExtendedPdfViewerService } from 'ngx-extended-pdf-viewer';
import { BottomSheetHeaderComponent } from '../../../shared/bottom-sheet-header/bottom-sheet-header.component';
import { MatSliderModule } from '@angular/material/slider';

@Component({
    selector: 'app-sectur',
    imports: [NgxExtendedPdfViewerModule, BottomSheetHeaderComponent, MatSliderModule],
    providers: [NgxExtendedPdfViewerService],
    templateUrl: './sectur.component.html',
    styleUrl: './sectur.component.scss'
})
export class SecturComponent {
  src="/assets/docs/04230055f32e1-cert-sm.pdf"
  close(){

  }
}

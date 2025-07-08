import { Component, inject, Inject, Sanitizer } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BottomSheetHeaderComponent } from '../../../../../shared/bottom-sheet-header/bottom-sheet-header.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-clip-auth-modal',
  imports: [MatBottomSheetModule],
  templateUrl: './clip-auth-modal.component.html',
  styleUrl: './clip-auth-modal.component.scss'
})
export class ClipAuthModalComponent {
  private _bottomSheetRef = inject<MatBottomSheetRef<ClipAuthModalComponent>>(MatBottomSheetRef)
  safe:any;
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public url: string, private sanitizer: DomSanitizer){
    this.safe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    this.listen3DSResponse(this.url);
  }
  listen3DSResponse(url: string) {
    const origin = new URL(url).origin;
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      console.log(event.data);
      if (event.data?.paymentId) {
        console.log('Returned Payment ID:', event.data.paymentId);
        window.removeEventListener('message', messageHandler);
        this._bottomSheetRef.dismiss(event.data);
      }
    };
    window.addEventListener('message', messageHandler);
  }
}

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-iframe-bottom-sheet',
    templateUrl: './iframe-bottom-sheet.component.html',
    styleUrl: './iframe-bottom-sheet.component.scss',
    imports: [XploraBottomSheetComponent]
})
export class IframeBottomSheetComponent implements OnInit, OnDestroy {
  url: string;
  safeUrl: SafeResourceUrl;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<IframeBottomSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { url: string, paymentId: string },
    sanitizer: DomSanitizer
  ) {
    this.url = data.url;  // La URL del iframe que recibimos como parámetro
    this.safeUrl = sanitizer.bypassSecurityTrustResourceUrl(data.url);
  }

  ngOnInit() {
    // Listener para el evento de mensaje desde el iframe
    window.addEventListener('message', this.handleIframeMessage.bind(this));
  }

  ngOnDestroy() {
    // Remover listener para evitar fugas de memoria
    window.removeEventListener('message', this.handleIframeMessage.bind(this));
  }

  // Manejar mensajes enviados desde el iframe
  handleIframeMessage(event: MessageEvent) {
    // Validar el origen del mensaje por seguridad
    if (event.origin !== 'https://tudominio.com') {
      console.warn('Mensaje de un origen no confiable:', event.origin);
      return;
    }

    const data = event.data;

    if (data.status === 'completed') {
      //console.log('Autenticación 3D Secure completada con Payment ID:', data.paymentId);
      // Cerrar el bottom sheet tras la autenticación exitosa
      this.bottomSheetRef.dismiss({ status: 'completed', paymentId: data.paymentId });
    } else if (data.status === 'error') {
      console.error('Error en la autenticación 3D Secure:', data.message);
    }
  }

  // Cerrar el bottom sheet manualmente
  closeBottomSheet(): void {
    this.bottomSheetRef.dismiss();
  }
}

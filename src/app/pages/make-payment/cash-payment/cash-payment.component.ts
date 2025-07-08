import { Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { PAYMENT_OFFICES, PaymentOffice } from '../../booking-process/payment/payment.component';
import { FirebaseBooking } from '../../../types/booking.types';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatInput } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CountdownConfig, CountdownEvent, CountdownModule } from 'ngx-countdown';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxPrintModule } from 'ngx-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-cash-payment',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatInput,
    MatFormFieldModule,
    CommonModule,
    CountdownModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    NgxPrintModule
  ],
  templateUrl: './cash-payment.component.html',
  styleUrl: './cash-payment.component.scss'
})
export class CashPaymentComponent implements OnInit {
  @Input() booking!: FirebaseBooking;
  locator: string = '';
  paymentOffices: PaymentOffice[] = PAYMENT_OFFICES;
  selectedOffice?: PaymentOffice;
  officeSelector: FormControl = new FormControl(null, [Validators.required]);
  countdownConfig: CountdownConfig = { leftTime: 300, format: 'hh:mm:ss', notify: [60] };
  countdownDanger: boolean = false;
  countdownCompleted: boolean = false;
  paymentList: { amount: number, count: number }[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      //console.log(this.selectedOffice?.showQR);
    }

    if(this.booking.payment!.paymentLimit){
      const paymentLimit = this.booking.payment!.paymentLimit.toMillis();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((paymentLimit - now) / 1000));
      this.countdownConfig.leftTime = secondsLeft;
    }

    if (this.booking.payment?.office) {
      this.officeSelector.setValue(this.booking.payment?.office, { emitEvent: true });
      this.selectedOffice = this.paymentOffices.find(office => office.id === this.booking.payment?.office);
      this.paymentList = this.getPaymentBreakdown(this.booking.payment!.totalDue!, this.selectedOffice?.maxAmmount ?? 4999).sort((b, a) => a.amount - b.amount);
    }

    this.officeSelector.valueChanges.subscribe(value => {
      if (value) {
        this.selectedOffice = this.paymentOffices.find(office => office.id === value);
        this.paymentList = this.getPaymentBreakdown(this.booking.payment!.totalDue!, this.selectedOffice?.maxAmmount ?? 4999).sort((b, a) => a.amount - b.amount);
      } else {
        this.selectedOffice = undefined;
      }
    });
  }

  countdownNotify(event: CountdownEvent) {
    if (event.action === 'notify') {
      const leftTime = event.left / 1000;
      if (leftTime <= 60) {
        this.countdownDanger = true;
      }
    } else if (event.action === 'done') {
      this.countdownCompleted = true;
    }
  }

  getPaymentBreakdown(totalAmount: number, maxAmount: number): { amount: number, count: number }[] {
    const flatPayments: number[] = [];
    while (totalAmount > maxAmount) {
      flatPayments.push(maxAmount);
      totalAmount -= maxAmount;
    }
    if (totalAmount > 0) {
      flatPayments.push(totalAmount);
    }
    const grouped: { [key: number]: number } = {};
    for (const payment of flatPayments) {
      grouped[payment] = (grouped[payment] || 0) + 1;
    }
    return Object.entries(grouped).map(([amount, count]) => ({
      amount: +amount,
      count
    }));
  }

  // Generar archivo (PDF o PNG) de cualquier elemento
  async generateFile(
    elementId: string, 
    margin: number = 20, 
    type: 'pdf' | 'png' = 'pdf',
    temporaryShowSelector: string = '.only-for-canvas'
  ): Promise<Blob> {
    if (!isPlatformBrowser(this.platformId)) throw new Error('Solo disponible en navegador');

    const element = document.getElementById(elementId)!;
    const images = element.querySelectorAll('img');

    // Cargar todas las imágenes antes de capturar
    await Promise.all(Array.from(images).map(img => {
      if (!img.complete) {
        return new Promise(resolve => img.onload = () => resolve(true));
      }
      return Promise.resolve(true);
    }));

    // Mostrar elementos ocultos temporalmente si se indicó un selector
    let hiddenElements: NodeListOf<HTMLElement> = [] as any;
    if (temporaryShowSelector) {
      hiddenElements = element.querySelectorAll(temporaryShowSelector);
      //console.log(hiddenElements);
      hiddenElements.forEach(el => el.classList.remove('hidden-for-screen'));
    }

    // Capturar el canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: false
    });

    // Volver a ocultar los elementos después de capturar
    if (temporaryShowSelector) {
      //console.log(hiddenElements);
      hiddenElements.forEach(el => el.classList.add('hidden-for-screen'));
    }

    // Lógica igual al resto (respetando márgenes como ya lo habíamos hecho)
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    if (type === 'png') {
      const canvasWithMargin = document.createElement('canvas');
      canvasWithMargin.width = imgWidth + margin * 2;
      canvasWithMargin.height = imgHeight + margin * 2;

      const ctx = canvasWithMargin.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWithMargin.width, canvasWithMargin.height);
      ctx.drawImage(canvas, margin, margin);

      const dataUrl = canvasWithMargin.toDataURL('image/png');
      const imgBlob = await (await fetch(dataUrl)).blob();
      return imgBlob;
    }

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = imgWidth / 2;
    const pdfHeight = imgHeight / 2;

    const pdf = new jsPDF({
      unit: 'pt',
      format: [pdfWidth + margin * 2, pdfHeight + margin * 2],
      orientation: 'landscape'
    });

    pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
    const pdfBlob = pdf.output('blob') as Blob;
    return pdfBlob;
  }


  // Compartir el archivo generado
  async shareFile(elementId: string, margin: number = 20, type: 'pdf' | 'png' = 'pdf') {
    try {
      const blob = await this.generateFile(elementId, margin, type);
      const mimeType = type === 'pdf' ? 'application/pdf' : 'image/png';
      const fileName = type === 'pdf' ? 'documento.pdf' : 'imagen.png';

      const file = new File([blob], fileName, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Instrucciones de pago',
          text: 'Aquí tienes el archivo generado'
        });
      } else {
        const url = URL.createObjectURL(blob);
        window.open(url);
      }
    } catch (err) {
      console.error('Error al compartir archivo:', err);
    }
  }
}
import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[phoneInput]'
})
export class PhoneFormatDirective {

  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: any) {
    let value = this.el.nativeElement.value.replace(/\D/g, ''); // Elimina caracteres no numéricos

    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    // Aplica el formato XX XX XX XX XX
    let formattedValue = value;
    if (value.length > 2) {
      formattedValue = `${value.substring(0, 2)} ${value.substring(2)}`;
    }
    if (value.length > 4) {
      formattedValue = `${value.substring(0, 2)} ${value.substring(2, 4)} ${value.substring(4)}`;
    }
    if (value.length > 6) {
      formattedValue = `${value.substring(0, 2)} ${value.substring(2, 4)} ${value.substring(4, 6)} ${value.substring(6)}`;
    }
    if (value.length > 8) {
      formattedValue = `${value.substring(0, 2)} ${value.substring(2, 4)} ${value.substring(4, 6)} ${value.substring(6, 8)} ${value.substring(8)}`;
    }

    this.el.nativeElement.value = formattedValue;
  }
}

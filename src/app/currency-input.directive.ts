import { Directive, HostListener, ElementRef, Input, OnInit, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

@Directive({
  selector: '[currencyInput]',
  standalone: true,
  providers: [CurrencyPipe]
})
export class CurrencyInputDirective implements OnInit {
  private _value: string | null = null;

  @Input() currencyCode: string = 'MXN';
  @Input() display: 'symbol' | 'code' | 'symbol-narrow' | string = '';
  @Input() digitsInfo: string = '1.2-2';
  @Input() locale: string = 'es-MX';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    @Optional() private ngControl: NgControl,
    private currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    if (this.ngControl?.value) {
      this.formatValue(this.ngControl.value);
    }
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string): void {
    const rawValue = this.extractNumericValue(value);
    this._value = rawValue;

    // Guardamos el valor limpio en el formulario sin formatear aún
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(rawValue, { emitEvent: false });
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.formatValue(this._value);
  }

  @HostListener('focus')
  onFocus(): void {
    const current = this.el.nativeElement.value;
    this.el.nativeElement.value = this.extractNumericValue(current);
  }

  private extractNumericValue(value: string): string {
    const clean = value.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return clean;
  }

  private formatValue(value: string | null): void {
    if (!value || value === '') {
      this.el.nativeElement.value = '';
      return;
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const formatted = this.currencyPipe.transform(
        numericValue,
        this.currencyCode,
        this.display,
        this.digitsInfo,
        this.locale
      );
      if (formatted != null) {
        this.el.nativeElement.value = formatted;
      }
    }
  }
}

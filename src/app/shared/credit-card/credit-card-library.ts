import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Directive, ElementRef, HostBinding, HostListener, NgModule, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type SupportedCardScheme = 'visa' | 'mastercard' | 'amex' | '';

function sanitizeDigits(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function detectCardScheme(cardNumber: string): SupportedCardScheme {
  const digits = sanitizeDigits(cardNumber);

  if (/^4/.test(digits)) {
    return 'visa';
  }

  if (/^3[47]/.test(digits)) {
    return 'amex';
  }

  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) {
    return 'mastercard';
  }

  return '';
}

function hasValidLength(cardNumber: string, scheme: SupportedCardScheme): boolean {
  const length = sanitizeDigits(cardNumber).length;

  switch (scheme) {
    case 'amex':
      return length === 15;
    case 'mastercard':
      return length === 16;
    case 'visa':
      return [13, 16, 19].includes(length);
    default:
      return false;
  }
}

function passesLuhn(cardNumber: string): boolean {
  const digits = sanitizeDigits(cardNumber);
  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length > 0 && sum % 10 === 0;
}

function formatCardNumber(cardNumber: string): string {
  const digits = sanitizeDigits(cardNumber).slice(0, 19);
  const scheme = detectCardScheme(digits);

  if (scheme === 'amex') {
    const groups = [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)];
    return groups.filter(Boolean).join(' ');
  }

  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

function formatExpiration(value: string): string {
  const digits = sanitizeDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function parseExpiration(value: unknown): { month: number; year: number } | null {
  const digits = sanitizeDigits(value);

  if (digits.length !== 4) {
    return null;
  }

  const month = Number(digits.slice(0, 2));
  const shortYear = Number(digits.slice(2));

  if (!Number.isInteger(month) || !Number.isInteger(shortYear) || month < 1 || month > 12) {
    return null;
  }

  return {
    month,
    year: 2000 + shortYear,
  };
}

export class CreditCardValidators {
  static validateCCNumber(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const digits = sanitizeDigits(value);
    const scheme = detectCardScheme(digits);

    if (!scheme || !hasValidLength(digits, scheme) || !passesLuhn(digits)) {
      return { creditCard: true };
    }

    return null;
  }

  static validateExpDate(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    if (!value) {
      return null;
    }

    const parsed = parseExpiration(value);

    if (!parsed) {
      return { expirationDate: true };
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (parsed.year < currentYear || (parsed.year === currentYear && parsed.month < currentMonth)) {
      return { expirationDate: true };
    }

    return null;
  }
}

@Directive({
  selector: 'input[ccNumber],input[ccnumber]',
  exportAs: 'ccNumber',
  standalone: true,
})
export class CreditCardFormatDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostBinding('attr.inputmode') readonly inputMode = 'numeric';
  @HostBinding('attr.autocomplete') readonly autocomplete = 'cc-number';

  readonly resolvedScheme$ = new BehaviorSubject<string>('');

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    const formattedValue = formatCardNumber(input.value);

    input.value = formattedValue;
    this.resolvedScheme$.next(detectCardScheme(formattedValue));
  }
}

@Directive({
  selector: 'input[ccExp],input[ccexp]',
  standalone: true,
})
export class CreditCardExpirationDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostBinding('attr.inputmode') readonly inputMode = 'numeric';
  @HostBinding('attr.autocomplete') readonly autocomplete = 'cc-exp';

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    input.value = formatExpiration(input.value);
  }
}

@Directive({
  selector: 'input[ccCVC],input[ccCvc],input[cccvc]',
  standalone: true,
})
export class CreditCardCvcDirective {
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  @HostBinding('attr.inputmode') readonly inputMode = 'numeric';
  @HostBinding('attr.autocomplete') readonly autocomplete = 'cc-csc';

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    input.value = sanitizeDigits(input.value).slice(0, 4);
  }
}

@NgModule({
  imports: [CreditCardFormatDirective, CreditCardExpirationDirective, CreditCardCvcDirective],
  exports: [CreditCardFormatDirective, CreditCardExpirationDirective, CreditCardCvcDirective],
})
export class CreditCardDirectivesModule {}

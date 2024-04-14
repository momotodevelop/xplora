import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appPreventEdit]',
  standalone: true
})
export class PreventEditDirective {

  constructor() { }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
  }
} 
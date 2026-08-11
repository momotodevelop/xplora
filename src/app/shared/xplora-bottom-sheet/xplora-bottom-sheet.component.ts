import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, TemplateRef } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface XploraBottomSheetTemplateContext {
  $implicit: XploraBottomSheetComponent;
  close: (result?: unknown) => void;
}

@Component({
  selector: 'app-xplora-bottom-sheet',
  standalone: true,
  imports: [NgTemplateOutlet, MatButtonModule, MatIconModule],
  templateUrl: './xplora-bottom-sheet.component.html',
  styleUrl: './xplora-bottom-sheet.component.scss'
})
export class XploraBottomSheetComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() closeLabel = 'Cerrar';
  @Input() showHandle = true;
  @Input() contentPadding = true;
  @Input() contentScrollable = true;
  @Input() footerPadding = true;
  @Input() headerTemplate: TemplateRef<XploraBottomSheetTemplateContext> | null = null;
  @Input() footerTemplate: TemplateRef<XploraBottomSheetTemplateContext> | null = null;

  @Output() readonly dismissed = new EventEmitter<unknown>();

  private readonly bottomSheetRef = inject(MatBottomSheetRef, { optional: true });

  readonly templateContext: XploraBottomSheetTemplateContext = {
    $implicit: this,
    close: (result?: unknown) => this.close(result)
  };

  get hasHeader(): boolean {
    return Boolean(this.headerTemplate || this.title || this.subtitle);
  }

  close(result?: unknown): void {
    this.dismissed.emit(result);
    this.bottomSheetRef?.dismiss(result);
  }
}

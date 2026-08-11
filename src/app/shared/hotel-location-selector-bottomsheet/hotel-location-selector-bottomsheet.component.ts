import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { DuffelStaysService } from '../../services/duffel-stays.service';
import {
  DuffelStaysDestinationSelection,
  DuffelStaysDestinationSuggestion,
  DuffelStaysDestinationType
} from '../../types/duffel-stays.types';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

@Component({
  selector: 'app-hotel-location-selector-bottomsheet',
  imports: [
    CommonModule,
    MatBottomSheetModule,
    ReactiveFormsModule,
    XploraBottomSheetComponent
  ],
  templateUrl: './hotel-location-selector-bottomsheet.component.html',
  styleUrl: './hotel-location-selector-bottomsheet.component.scss',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(-10px)' }),
            stagger(
              '45ms',
              animate(
                '220ms ease-out',
                style({ opacity: 1, transform: 'translateY(0)' })
              )
            )
          ],
          { optional: true }
        )
      ])
    ])
  ]
})
export class HotelLocationSelectorBottomsheetComponent
implements OnInit, OnDestroy {
  readonly searchInput = new FormControl('', { nonNullable: true });
  options: DuffelStaysDestinationSuggestion[] = [];
  loading = false;
  searched = false;
  errorMessage = '';

  private searchSubscription?: Subscription;
  private requestSequence = 0;

  constructor(
    private stays: DuffelStaysService,
    private ref: MatBottomSheetRef<HotelLocationSelectorBottomsheetComponent>
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchInput.valueChanges.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(value => {
      void this.loadSuggestions(value);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  getTypeLabel(type: DuffelStaysDestinationType): string {
    if (type === 'city') {
      return 'Destino';
    }
    if (type === 'airport') {
      return 'Aeropuerto';
    }
    return 'Hotel';
  }

  selectDestination(option: DuffelStaysDestinationSuggestion): void {
    const selection: DuffelStaysDestinationSelection = {
      id: option.id,
      type: option.type,
      name: option.name,
      lat: option.latitude,
      lng: option.longitude
    };
    this.ref.dismiss(selection);
  }

  trackSuggestion(
    _index: number,
    option: DuffelStaysDestinationSuggestion
  ): string {
    return `${option.type}:${option.id}`;
  }

  private async loadSuggestions(rawQuery: string): Promise<void> {
    const queryValue = rawQuery.trim();
    const currentRequest = ++this.requestSequence;
    this.errorMessage = '';

    if (queryValue.length < 3) {
      this.options = [];
      this.loading = false;
      this.searched = false;
      return;
    }

    this.loading = true;
    this.searched = true;
    try {
      const response = await this.stays.suggestDestinations(queryValue);
      if (currentRequest !== this.requestSequence) {
        return;
      }
      this.options = response.data || [];
    } catch {
      if (currentRequest !== this.requestSequence) {
        return;
      }
      this.options = [];
      this.errorMessage =
        'No fue posible consultar destinos en Duffel. Intenta nuevamente.';
    } finally {
      if (currentRequest === this.requestSequence) {
        this.loading = false;
      }
    }
  }
}

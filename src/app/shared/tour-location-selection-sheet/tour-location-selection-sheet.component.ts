import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime } from 'rxjs';
import { AmadeusAuthService } from '../../services/amadeus-auth.service';
import { AirportSearchService } from '../../services/airport-search.service';
import { AmadeusLocation } from '../../types/amadeus-airport-response.types';
import { TitleCasePipe } from '@angular/common';
import { XploraBottomSheetComponent } from '../xplora-bottom-sheet/xplora-bottom-sheet.component';

interface TourDestinationSuggestion {
  label: string;
  iataCode: string;
}

const TOUR_DESTINATIONS: TourDestinationSuggestion[] = [
  { label: 'Cancun', iataCode: 'CUN' },
  { label: 'Merida', iataCode: 'MID' },
  { label: 'Playa del Carmen', iataCode: 'PCM' },
  { label: 'Puerto Vallarta', iataCode: 'PVR' },
  { label: 'Los Cabos', iataCode: 'SJD' }
];

@Component({
  selector: 'app-tour-location-selection-sheet',
  imports: [
    MatBottomSheetModule,
    MatButtonModule,
    ScrollingModule,
    ReactiveFormsModule,
    TitleCasePipe,
    MatSnackBarModule,
    XploraBottomSheetComponent
  ],
  templateUrl: './tour-location-selection-sheet.component.html',
  styleUrl: './tour-location-selection-sheet.component.scss'
})
export class TourLocationSelectionSheetComponent implements OnInit {
  token: string | null = null;
  searchInput = new FormControl('');
  locationResults: AmadeusLocation[] = [];
  loading = false;
  suggestedDestinations = TOUR_DESTINATIONS;
  @ViewChild('search') searchElement!: ElementRef;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<TourLocationSelectionSheetComponent>,
    private auth: AmadeusAuthService,
    private airports: AirportSearchService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.searchInput.disable();
    this.generateToken();
    this.searchInput.valueChanges.pipe(debounceTime(500)).subscribe({
      next: (value) => {
        this.locationResults = [];
        if (value && value.length > 1) {
          this.searchCities(value);
        }
      }
    });
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }

  selectLocation(location: AmadeusLocation): void {
    this.bottomSheetRef.dismiss(location);
  }

  selectSuggested(destination: TourDestinationSuggestion): void {
    if (!this.token) return;
    this.loading = true;
    this.airports.getLocation(`C${destination.iataCode}`, this.token).subscribe({
      next: (response) => {
        this.bottomSheetRef.dismiss(response.data);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo cargar el destino.', undefined, { duration: 2000 });
      }
    });
  }

  private searchCities(keyword: string): void {
    if (!this.token) return;
    this.loading = true;
    this.airports.searchAirports(keyword, this.token, ['CITY']).subscribe({
      next: (response) => {
        if (response.meta.count === 0) {
          this.snackBar.open('No se encontraron resultados', undefined, { duration: 2000 });
          this.locationResults = [];
        } else {
          this.locationResults = response.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('No se pudo buscar ciudades.', undefined, { duration: 2000 });
      }
    });
  }

  private generateToken(): void {
    this.auth.getToken().subscribe({
      next: (token) => {
        this.token = token;
        this.searchInput.enable();
        this.searchElement?.nativeElement?.focus();
      },
      error: () => {
        this.snackBar.open('No se pudo obtener token de Amadeus.', undefined, { duration: 2000 });
      }
    });
  }
}

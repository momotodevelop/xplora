import { Component, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-bottomsheet-destination-search',
  imports: [MatTabsModule, MatInputModule, MatFormFieldModule],
  templateUrl: './bottomsheet-destination-search.component.html',
  styleUrl: './bottomsheet-destination-search.component.scss'
})
export class BottomsheetDestinationSearchComponent {
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { origin: string }) {}
}

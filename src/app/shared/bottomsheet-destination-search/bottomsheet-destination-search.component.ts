import { Component } from '@angular/core';
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
  
}

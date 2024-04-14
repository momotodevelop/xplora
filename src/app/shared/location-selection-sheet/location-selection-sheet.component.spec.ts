import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationSelectionSheetComponent } from './location-selection-sheet.component';

describe('LocationSelectionSheetComponent', () => {
  let component: LocationSelectionSheetComponent;
  let fixture: ComponentFixture<LocationSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationSelectionSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

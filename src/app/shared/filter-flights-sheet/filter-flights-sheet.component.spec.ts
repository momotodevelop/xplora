import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterFlightsSheetComponent } from './filter-flights-sheet.component';

describe('FilterFlightsSheetComponent', () => {
  let component: FilterFlightsSheetComponent;
  let fixture: ComponentFixture<FilterFlightsSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterFlightsSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterFlightsSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

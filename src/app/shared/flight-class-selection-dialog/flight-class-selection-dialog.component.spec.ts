import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightClassSelectionDialogComponent } from './flight-class-selection-dialog.component';

describe('FlightClassSelectionDialogComponent', () => {
  let component: FlightClassSelectionDialogComponent;
  let fixture: ComponentFixture<FlightClassSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightClassSelectionDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlightClassSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

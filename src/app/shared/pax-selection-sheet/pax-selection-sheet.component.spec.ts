import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaxSelectionSheetComponent } from './pax-selection-sheet.component';

describe('PaxSelectionSheetComponent', () => {
  let component: PaxSelectionSheetComponent;
  let fixture: ComponentFixture<PaxSelectionSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaxSelectionSheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PaxSelectionSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectSeatMapBottomsheetComponent } from './select-seat-map-bottomsheet.component';

describe('SelectSeatMapBottomsheetComponent', () => {
  let component: SelectSeatMapBottomsheetComponent;
  let fixture: ComponentFixture<SelectSeatMapBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectSeatMapBottomsheetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectSeatMapBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

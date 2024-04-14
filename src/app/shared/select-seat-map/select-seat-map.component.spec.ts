import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectSeatMapComponent } from './select-seat-map.component';

describe('SelectSeatMapComponent', () => {
  let component: SelectSeatMapComponent;
  let fixture: ComponentFixture<SelectSeatMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectSeatMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectSeatMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

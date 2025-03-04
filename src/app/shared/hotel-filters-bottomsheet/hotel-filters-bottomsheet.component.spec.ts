import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelFiltersBottomsheetComponent } from './hotel-filters-bottomsheet.component';

describe('HotelFiltersBottomsheetComponent', () => {
  let component: HotelFiltersBottomsheetComponent;
  let fixture: ComponentFixture<HotelFiltersBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelFiltersBottomsheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelFiltersBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

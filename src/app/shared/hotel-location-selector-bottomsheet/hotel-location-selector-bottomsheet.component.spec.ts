import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelLocationSelectorBottomsheetComponent } from './hotel-location-selector-bottomsheet.component';

describe('HotelLocationSelectorBottomsheetComponent', () => {
  let component: HotelLocationSelectorBottomsheetComponent;
  let fixture: ComponentFixture<HotelLocationSelectorBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelLocationSelectorBottomsheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelLocationSelectorBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

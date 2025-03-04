import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSearchBottomsheetComponent } from './hotel-search-bottomsheet.component';

describe('HotelSearchBottomsheetComponent', () => {
  let component: HotelSearchBottomsheetComponent;
  let fixture: ComponentFixture<HotelSearchBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSearchBottomsheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelSearchBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

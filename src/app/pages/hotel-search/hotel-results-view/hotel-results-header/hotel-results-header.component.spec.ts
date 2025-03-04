import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelResultsHeaderComponent } from './hotel-results-header.component';

describe('HotelResultsHeaderComponent', () => {
  let component: HotelResultsHeaderComponent;
  let fixture: ComponentFixture<HotelResultsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelResultsHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelResultsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

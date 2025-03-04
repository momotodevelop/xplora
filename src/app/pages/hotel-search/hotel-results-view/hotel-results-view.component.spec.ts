import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelResultsViewComponent } from './hotel-results-view.component';

describe('HotelResultsViewComponent', () => {
  let component: HotelResultsViewComponent;
  let fixture: ComponentFixture<HotelResultsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelResultsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelResultsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

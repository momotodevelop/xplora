import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsHighlightsComponent } from './hotel-details-highlights.component';

describe('HotelDetailsHighlightsComponent', () => {
  let component: HotelDetailsHighlightsComponent;
  let fixture: ComponentFixture<HotelDetailsHighlightsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsHighlightsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsHighlightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

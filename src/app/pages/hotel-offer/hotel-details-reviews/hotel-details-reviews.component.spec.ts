import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsReviewsComponent } from './hotel-details-reviews.component';

describe('HotelDetailsReviewsComponent', () => {
  let component: HotelDetailsReviewsComponent;
  let fixture: ComponentFixture<HotelDetailsReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsReviewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

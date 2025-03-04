import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsFixedHeaderComponent } from './hotel-details-fixed-header.component';

describe('HotelDetailsFixedHeaderComponent', () => {
  let component: HotelDetailsFixedHeaderComponent;
  let fixture: ComponentFixture<HotelDetailsFixedHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsFixedHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsFixedHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

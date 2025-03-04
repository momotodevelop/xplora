import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsLocationComponent } from './hotel-details-location.component';

describe('HotelDetailsLocationComponent', () => {
  let component: HotelDetailsLocationComponent;
  let fixture: ComponentFixture<HotelDetailsLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsLocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

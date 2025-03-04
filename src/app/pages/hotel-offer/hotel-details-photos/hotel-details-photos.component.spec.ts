import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsPhotosComponent } from './hotel-details-photos.component';

describe('HotelDetailsPhotosComponent', () => {
  let component: HotelDetailsPhotosComponent;
  let fixture: ComponentFixture<HotelDetailsPhotosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsPhotosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsPhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

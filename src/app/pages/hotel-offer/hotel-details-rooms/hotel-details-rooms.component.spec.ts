import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsRoomsComponent } from './hotel-details-rooms.component';

describe('HotelDetailsRoomsComponent', () => {
  let component: HotelDetailsRoomsComponent;
  let fixture: ComponentFixture<HotelDetailsRoomsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsRoomsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsRoomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

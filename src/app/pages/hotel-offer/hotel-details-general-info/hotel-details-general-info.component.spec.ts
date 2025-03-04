import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsGeneralInfoComponent } from './hotel-details-general-info.component';

describe('HotelDetailsGeneralInfoComponent', () => {
  let component: HotelDetailsGeneralInfoComponent;
  let fixture: ComponentFixture<HotelDetailsGeneralInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsGeneralInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsGeneralInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

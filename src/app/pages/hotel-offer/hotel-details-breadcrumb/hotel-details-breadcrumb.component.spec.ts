import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelDetailsBreadcrumbComponent } from './hotel-details-breadcrumb.component';

describe('HotelDetailsBreadcrumbComponent', () => {
  let component: HotelDetailsBreadcrumbComponent;
  let fixture: ComponentFixture<HotelDetailsBreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelDetailsBreadcrumbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelDetailsBreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

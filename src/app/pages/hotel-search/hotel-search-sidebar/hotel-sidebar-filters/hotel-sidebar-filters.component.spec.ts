import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSidebarFiltersComponent } from './hotel-sidebar-filters.component';

describe('HotelSidebarFiltersComponent', () => {
  let component: HotelSidebarFiltersComponent;
  let fixture: ComponentFixture<HotelSidebarFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSidebarFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelSidebarFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

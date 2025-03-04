import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSidebarSearchDetailsComponent } from './hotel-sidebar-search-details.component';

describe('HotelSidebarSearchDetailsComponent', () => {
  let component: HotelSidebarSearchDetailsComponent;
  let fixture: ComponentFixture<HotelSidebarSearchDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSidebarSearchDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelSidebarSearchDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

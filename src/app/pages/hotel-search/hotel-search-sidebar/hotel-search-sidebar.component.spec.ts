import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSearchSidebarComponent } from './hotel-search-sidebar.component';

describe('HotelSearchSidebarComponent', () => {
  let component: HotelSearchSidebarComponent;
  let fixture: ComponentFixture<HotelSearchSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSearchSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelSearchSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

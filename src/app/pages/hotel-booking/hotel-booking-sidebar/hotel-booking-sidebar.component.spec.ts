import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelBookingSidebarComponent } from './hotel-booking-sidebar.component';

describe('HotelBookingSidebarComponent', () => {
  let component: HotelBookingSidebarComponent;
  let fixture: ComponentFixture<HotelBookingSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelBookingSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HotelBookingSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingDetailsAdminComponent } from './booking-details-admin.component';

describe('BookingDetailsAdminComponent', () => {
  let component: BookingDetailsAdminComponent;
  let fixture: ComponentFixture<BookingDetailsAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingDetailsAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingDetailsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

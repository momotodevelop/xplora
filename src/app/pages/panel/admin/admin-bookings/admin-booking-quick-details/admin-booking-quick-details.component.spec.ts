import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBookingQuickDetailsComponent } from './admin-booking-quick-details.component';

describe('AdminBookingQuickDetailsComponent', () => {
  let component: AdminBookingQuickDetailsComponent;
  let fixture: ComponentFixture<AdminBookingQuickDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBookingQuickDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBookingQuickDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

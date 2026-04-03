import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingQuickDetailsComponent } from './booking-quick-details.component';

describe('BookingQuickDetailsComponent', () => {
  let component: BookingQuickDetailsComponent;
  let fixture: ComponentFixture<BookingQuickDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingQuickDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingQuickDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

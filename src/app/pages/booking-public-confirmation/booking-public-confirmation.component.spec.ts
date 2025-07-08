import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingPublicConfirmationComponent } from './booking-public-confirmation.component';

describe('BookingPublicConfirmationComponent', () => {
  let component: BookingPublicConfirmationComponent;
  let fixture: ComponentFixture<BookingPublicConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingPublicConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingPublicConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

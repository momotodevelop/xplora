import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingProcessLoginBottomsheetComponent } from './booking-process-login-bottomsheet.component';

describe('BookingProcessLoginBottomsheetComponent', () => {
  let component: BookingProcessLoginBottomsheetComponent;
  let fixture: ComponentFixture<BookingProcessLoginBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingProcessLoginBottomsheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingProcessLoginBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

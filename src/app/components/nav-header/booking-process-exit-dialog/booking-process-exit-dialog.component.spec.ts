import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingProcessExitDialogComponent } from './booking-process-exit-dialog.component';

describe('BookingProcessExitDialogComponent', () => {
  let component: BookingProcessExitDialogComponent;
  let fixture: ComponentFixture<BookingProcessExitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingProcessExitDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingProcessExitDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

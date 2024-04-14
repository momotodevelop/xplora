import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingProcessComponent } from './booking-process.component';

describe('BookingProcessComponent', () => {
  let component: BookingProcessComponent;
  let fixture: ComponentFixture<BookingProcessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingProcessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingProcessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

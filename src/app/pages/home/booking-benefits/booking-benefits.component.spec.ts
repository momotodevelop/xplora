import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingBenefitsComponent } from './booking-benefits.component';

describe('BookingBenefitsComponent', () => {
  let component: BookingBenefitsComponent;
  let fixture: ComponentFixture<BookingBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingBenefitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingBenefitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

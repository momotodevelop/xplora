import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelerBookingsComponent } from './traveler-bookings.component';

describe('TravelerBookingsComponent', () => {
  let component: TravelerBookingsComponent;
  let fixture: ComponentFixture<TravelerBookingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerBookingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

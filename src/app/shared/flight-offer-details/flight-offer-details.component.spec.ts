import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightOfferDetailsComponent } from './flight-offer-details.component';

describe('FlightOfferDetailsComponent', () => {
  let component: FlightOfferDetailsComponent;
  let fixture: ComponentFixture<FlightOfferDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightOfferDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlightOfferDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

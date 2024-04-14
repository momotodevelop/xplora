import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightOfferComponent } from './flight-offer.component';

describe('FlightOfferComponent', () => {
  let component: FlightOfferComponent;
  let fixture: ComponentFixture<FlightOfferComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightOfferComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FlightOfferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

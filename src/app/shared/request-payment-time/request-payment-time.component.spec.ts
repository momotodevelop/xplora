import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestPaymentTimeComponent } from './request-payment-time.component';

describe('RequestPaymentTimeComponent', () => {
  let component: RequestPaymentTimeComponent;
  let fixture: ComponentFixture<RequestPaymentTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestPaymentTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestPaymentTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

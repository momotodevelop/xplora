import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeiPaymentComponent } from './spei-payment.component';

describe('SpeiPaymentComponent', () => {
  let component: SpeiPaymentComponent;
  let fixture: ComponentFixture<SpeiPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpeiPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpeiPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

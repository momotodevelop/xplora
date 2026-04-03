import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidatingPaymentComponent } from './validating-payment.component';

describe('ValidatingPaymentComponent', () => {
  let component: ValidatingPaymentComponent;
  let fixture: ComponentFixture<ValidatingPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidatingPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidatingPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

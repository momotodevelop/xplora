import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { XploraGatewayComponent } from './xplora-gateway.component';
import { XploraCardServicesService } from '../../services/xplora-card-services.service';

describe('XploraGatewayComponent', () => {
  let component: XploraGatewayComponent;
  let fixture: ComponentFixture<XploraGatewayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XploraGatewayComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        {
          provide: XploraCardServicesService,
          useValue: {
            getCardAttemptCount: () => of(0),
            addPayment: () => Promise.resolve('payment-id')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(XploraGatewayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require the billing address after valid card details', () => {
    component.cardForm.setValue({
      number: '4111 1111 1111 1111',
      type: 'visa',
      expiration: '12/99',
      cvv: '123',
      holder: 'Cliente Xplora',
      installments: 1
    });

    expect(component.isCardComplete).toBeTrue();
    expect(component.isComplete).toBeFalse();
  });
});

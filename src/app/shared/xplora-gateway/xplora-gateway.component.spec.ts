import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { XploraGatewayComponent } from './xplora-gateway.component';
import { XploraCardServicesService } from '../../services/xplora-card-services.service';
import { PostaliaService } from '../../services/postalia.service';

describe('XploraGatewayComponent', () => {
  let component: XploraGatewayComponent;
  let fixture: ComponentFixture<XploraGatewayComponent>;
  let postalia: jasmine.SpyObj<PostaliaService>;

  beforeEach(async () => {
    postalia = jasmine.createSpyObj<PostaliaService>('PostaliaService', ['getPostalCode']);
    postalia.getPostalCode.and.returnValue(of({
      codigo_postal: '01000',
      estado: 'Ciudad de México',
      municipio: 'Álvaro Obregón',
      ciudad: 'Ciudad de México',
      zona: 'Urbano',
      colonias: [
        { nombre: 'Florida', tipo: 'Colonia' },
        { nombre: 'Campestre', tipo: 'Colonia' }
      ]
    }));

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
        },
        { provide: PostaliaService, useValue: postalia }
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

  it('should only look up valid Mexican postal codes', fakeAsync(() => {
    component.addressForm.controls.postalCode.setValue('01000');
    tick(350);

    expect(postalia.getPostalCode).toHaveBeenCalledOnceWith('01000');
    expect(component.addressForm.controls.city.value).toBe('Ciudad de México');
    expect(component.addressForm.controls.state.value).toBe('Ciudad de México');
    expect(component.addressForm.controls.city.disabled).toBeTrue();
    expect(component.addressForm.controls.state.disabled).toBeTrue();
    expect(component.availableNeighborhoods).toEqual(['Florida', 'Campestre']);
  }));

  it('should not look up invalid or non-Mexican postal codes', fakeAsync(() => {
    component.addressForm.controls.postalCode.setValue('0100A');
    tick(350);
    component.addressForm.controls.countryCode.setValue('US');
    component.addressForm.controls.postalCode.setValue('90210');
    tick(350);

    expect(postalia.getPostalCode).not.toHaveBeenCalled();
  }));

  it('should keep manual address fields available when Postalia fails', fakeAsync(() => {
    postalia.getPostalCode.and.returnValue(throwError(() => new Error('POSTALIA_ERROR')));
    component.addressForm.controls.postalCode.setValue('01000');
    tick(350);

    expect(component.addressAutocompleted).toBeFalse();
    expect(component.addressForm.controls.city.enabled).toBeTrue();
    expect(component.addressForm.controls.state.enabled).toBeTrue();
    expect(component.availableNeighborhoods).toEqual([]);
  }));

  it('should store a manually entered neighborhood instead of the fallback option', () => {
    component.availableNeighborhoods = ['Florida'];
    component.neighborhoodSelection.setValue(component.manualNeighborhoodOption);
    component.addressForm.controls.neighborhood.setValue('San Ángel');

    expect(component.isManualNeighborhood).toBeTrue();
    expect(component.billingAddress.neighborhood).toBe('San Ángel');
  });
});

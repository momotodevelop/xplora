import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetryXploraGatewayComponent } from './retry-xplora-gateway.component';

describe('RetryXploraGatewayComponent', () => {
  let component: RetryXploraGatewayComponent;
  let fixture: ComponentFixture<RetryXploraGatewayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetryXploraGatewayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetryXploraGatewayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

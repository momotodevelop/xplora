import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPremiumInsuranceComponent } from './add-insurance.component';

describe('AddInsuranceComponent', () => {
  let component: AddPremiumInsuranceComponent;
  let fixture: ComponentFixture<AddPremiumInsuranceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPremiumInsuranceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddPremiumInsuranceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBaggageComponent } from './add-baggage.component';

describe('AddBaggageComponent', () => {
  let component: AddBaggageComponent;
  let fixture: ComponentFixture<AddBaggageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddBaggageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddBaggageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCarryOnComponent } from './add-carry-on.component';

describe('AddCarryOnComponent', () => {
  let component: AddCarryOnComponent;
  let fixture: ComponentFixture<AddCarryOnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCarryOnComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCarryOnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

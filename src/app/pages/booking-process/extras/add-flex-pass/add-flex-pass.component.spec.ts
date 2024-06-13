import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFlexPassComponent } from './add-flex-pass.component';

describe('AddFlexPassComponent', () => {
  let component: AddFlexPassComponent;
  let fixture: ComponentFixture<AddFlexPassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFlexPassComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFlexPassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XploraiComponent } from './xplorai.component';

describe('XploraiComponent', () => {
  let component: XploraiComponent;
  let fixture: ComponentFixture<XploraiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XploraiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XploraiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

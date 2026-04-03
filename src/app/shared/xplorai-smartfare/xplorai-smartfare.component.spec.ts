import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XploraiSmartfareComponent } from './xplorai-smartfare.component';

describe('XploraiSmartfareComponent', () => {
  let component: XploraiSmartfareComponent;
  let fixture: ComponentFixture<XploraiSmartfareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XploraiSmartfareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XploraiSmartfareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

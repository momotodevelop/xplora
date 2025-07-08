import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XplorersLandingComponent } from './xplorers-landing.component';

describe('XplorersLandingComponent', () => {
  let component: XplorersLandingComponent;
  let fixture: ComponentFixture<XplorersLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XplorersLandingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XplorersLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

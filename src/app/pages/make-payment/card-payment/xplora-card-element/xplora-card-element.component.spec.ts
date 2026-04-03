import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XploraCardElementComponent } from './xplora-card-element.component';

describe('XploraCardElementComponent', () => {
  let component: XploraCardElementComponent;
  let fixture: ComponentFixture<XploraCardElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XploraCardElementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XploraCardElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

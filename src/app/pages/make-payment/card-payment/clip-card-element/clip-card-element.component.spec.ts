import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipCardElementComponent } from './clip-card-element.component';

describe('ClipCardElementComponent', () => {
  let component: ClipCardElementComponent;
  let fixture: ComponentFixture<ClipCardElementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClipCardElementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClipCardElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

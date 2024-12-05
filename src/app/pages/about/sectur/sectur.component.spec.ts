import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecturComponent } from './sectur.component';

describe('SecturComponent', () => {
  let component: SecturComponent;
  let fixture: ComponentFixture<SecturComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecturComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecturComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

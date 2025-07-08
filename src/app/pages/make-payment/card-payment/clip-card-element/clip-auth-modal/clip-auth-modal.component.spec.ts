import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipAuthModalComponent } from './clip-auth-modal.component';

describe('ClipAuthModalComponent', () => {
  let component: ClipAuthModalComponent;
  let fixture: ComponentFixture<ClipAuthModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClipAuthModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClipAuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

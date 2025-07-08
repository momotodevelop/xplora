import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsTextComponent } from './terms-text.component';

describe('TermsTextComponent', () => {
  let component: TermsTextComponent;
  let fixture: ComponentFixture<TermsTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

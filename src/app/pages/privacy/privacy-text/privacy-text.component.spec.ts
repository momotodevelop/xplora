import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyTextComponent } from './privacy-text.component';

describe('PrivacyTextComponent', () => {
  let component: PrivacyTextComponent;
  let fixture: ComponentFixture<PrivacyTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyTextComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

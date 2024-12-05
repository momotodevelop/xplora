import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneLoginBottomSheetComponent } from './phone-login-bottom-sheet.component';

describe('PhoneLoginBottomSheetComponent', () => {
  let component: PhoneLoginBottomSheetComponent;
  let fixture: ComponentFixture<PhoneLoginBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneLoginBottomSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhoneLoginBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

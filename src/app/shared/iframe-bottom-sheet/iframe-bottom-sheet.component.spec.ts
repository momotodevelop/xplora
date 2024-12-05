import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IframeBottomSheetComponent } from './iframe-bottom-sheet.component';

describe('IframeBottomSheetComponent', () => {
  let component: IframeBottomSheetComponent;
  let fixture: ComponentFixture<IframeBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IframeBottomSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IframeBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

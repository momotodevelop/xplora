import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomSheetHeaderComponent } from './bottom-sheet-header.component';

describe('BottomSheetHeaderComponent', () => {
  let component: BottomSheetHeaderComponent;
  let fixture: ComponentFixture<BottomSheetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomSheetHeaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomSheetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

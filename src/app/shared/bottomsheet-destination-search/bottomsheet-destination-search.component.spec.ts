import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomsheetDestinationSearchComponent } from './bottomsheet-destination-search.component';

describe('BottomsheetDestinationSearchComponent', () => {
  let component: BottomsheetDestinationSearchComponent;
  let fixture: ComponentFixture<BottomsheetDestinationSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomsheetDestinationSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomsheetDestinationSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

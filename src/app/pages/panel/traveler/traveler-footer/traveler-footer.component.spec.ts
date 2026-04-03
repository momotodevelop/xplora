import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelerFooterComponent } from './traveler-footer.component';

describe('TravelerFooterComponent', () => {
  let component: TravelerFooterComponent;
  let fixture: ComponentFixture<TravelerFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerFooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

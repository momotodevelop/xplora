import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedDestinationsComponent } from './recommended-destinations.component';

describe('RecommendedDestinationsComponent', () => {
  let component: RecommendedDestinationsComponent;
  let fixture: ComponentFixture<RecommendedDestinationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedDestinationsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecommendedDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivityResultItemComponent } from './activity-result-item.component';

describe('ActivityResultItemComponent', () => {
  let component: ActivityResultItemComponent;
  let fixture: ComponentFixture<ActivityResultItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityResultItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivityResultItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

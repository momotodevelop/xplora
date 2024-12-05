import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavHeaderDashboardComponent } from './nav-header-dashboard.component';

describe('NavHeaderDashboardComponent', () => {
  let component: NavHeaderDashboardComponent;
  let fixture: ComponentFixture<NavHeaderDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavHeaderDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavHeaderDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

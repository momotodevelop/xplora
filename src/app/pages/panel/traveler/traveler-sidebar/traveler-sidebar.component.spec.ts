import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelerSidebarComponent } from './traveler-sidebar.component';

describe('TravelerSidebarComponent', () => {
  let component: TravelerSidebarComponent;
  let fixture: ComponentFixture<TravelerSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

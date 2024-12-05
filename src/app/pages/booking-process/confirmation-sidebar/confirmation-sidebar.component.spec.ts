import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationSidebarComponent } from './confirmation-sidebar.component';

describe('ConfirmationSidebarComponent', () => {
  let component: ConfirmationSidebarComponent;
  let fixture: ComponentFixture<ConfirmationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

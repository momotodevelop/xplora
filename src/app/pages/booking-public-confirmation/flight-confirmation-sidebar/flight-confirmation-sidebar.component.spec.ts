import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightConfirmationSidebarComponent } from './flight-confirmation-sidebar.component';

describe('FlightConfirmationSidebarComponent', () => {
  let component: FlightConfirmationSidebarComponent;
  let fixture: ComponentFixture<FlightConfirmationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlightConfirmationSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightConfirmationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

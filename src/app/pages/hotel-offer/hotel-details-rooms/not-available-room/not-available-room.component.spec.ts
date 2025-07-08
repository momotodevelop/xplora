import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotAvailableRoomComponent } from './not-available-room.component';

describe('NotAvailableRoomComponent', () => {
  let component: NotAvailableRoomComponent;
  let fixture: ComponentFixture<NotAvailableRoomComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotAvailableRoomComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotAvailableRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

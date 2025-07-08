import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomDetailsPopupComponent } from './room-details-popup.component';

describe('RoomDetailsPopupComponent', () => {
  let component: RoomDetailsPopupComponent;
  let fixture: ComponentFixture<RoomDetailsPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetailsPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoomDetailsPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

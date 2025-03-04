import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingCreationLoaderComponent } from './booking-creation-loader.component';

describe('BookingCreationLoaderComponent', () => {
  let component: BookingCreationLoaderComponent;
  let fixture: ComponentFixture<BookingCreationLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCreationLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingCreationLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

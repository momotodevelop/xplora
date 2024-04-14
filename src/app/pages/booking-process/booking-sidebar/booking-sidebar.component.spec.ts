import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingSidebarComponent } from './booking-sidebar.component';

describe('BookingSidebarComponent', () => {
  let component: BookingSidebarComponent;
  let fixture: ComponentFixture<BookingSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingSidebarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BookingSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

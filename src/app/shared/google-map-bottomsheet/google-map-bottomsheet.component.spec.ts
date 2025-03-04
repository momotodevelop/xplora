import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleMapBottomsheetComponent } from './google-map-bottomsheet.component';

describe('GoogleMapBottomsheetComponent', () => {
  let component: GoogleMapBottomsheetComponent;
  let fixture: ComponentFixture<GoogleMapBottomsheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleMapBottomsheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleMapBottomsheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

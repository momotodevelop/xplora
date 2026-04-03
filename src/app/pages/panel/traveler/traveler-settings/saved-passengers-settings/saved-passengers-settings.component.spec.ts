import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedPassengersSettingsComponent } from './saved-passengers-settings.component';

describe('SavedPassengersSettingsComponent', () => {
  let component: SavedPassengersSettingsComponent;
  let fixture: ComponentFixture<SavedPassengersSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedPassengersSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedPassengersSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

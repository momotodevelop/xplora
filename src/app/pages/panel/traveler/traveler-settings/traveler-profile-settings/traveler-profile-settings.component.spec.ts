import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelerProfileSettingsComponent } from './traveler-profile-settings.component';

describe('TravelerProfileSettingsComponent', () => {
  let component: TravelerProfileSettingsComponent;
  let fixture: ComponentFixture<TravelerProfileSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerProfileSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerProfileSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

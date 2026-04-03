import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TravelerSettingsComponent } from './traveler-settings.component';

describe('TravelerSettingsComponent', () => {
  let component: TravelerSettingsComponent;
  let fixture: ComponentFixture<TravelerSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

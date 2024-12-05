import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TravelerHomeComponent } from './traveler-home.component';

describe('HomeComponent', () => {
  let component: TravelerHomeComponent;
  let fixture: ComponentFixture<TravelerHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TravelerHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TravelerHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

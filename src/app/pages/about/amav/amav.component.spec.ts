import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmavComponent } from './amav.component';

describe('AmavComponent', () => {
  let component: AmavComponent;
  let fixture: ComponentFixture<AmavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

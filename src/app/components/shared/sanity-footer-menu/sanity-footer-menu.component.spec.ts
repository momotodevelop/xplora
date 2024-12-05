import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SanityFooterMenuComponent } from './sanity-footer-menu.component';

describe('SanityFooterMenuComponent', () => {
  let component: SanityFooterMenuComponent;
  let fixture: ComponentFixture<SanityFooterMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SanityFooterMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SanityFooterMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

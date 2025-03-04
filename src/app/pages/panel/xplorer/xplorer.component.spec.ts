import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XplorerComponent } from './xplorer.component';

describe('XplorerComponent', () => {
  let component: XplorerComponent;
  let fixture: ComponentFixture<XplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XplorerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

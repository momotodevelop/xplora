import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolderComponent } from './holder.component';

describe('HolderComponent', () => {
  let component: HolderComponent;
  let fixture: ComponentFixture<HolderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

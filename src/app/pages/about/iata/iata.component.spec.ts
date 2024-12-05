import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IataComponent } from './iata.component';

describe('IataComponent', () => {
  let component: IataComponent;
  let fixture: ComponentFixture<IataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

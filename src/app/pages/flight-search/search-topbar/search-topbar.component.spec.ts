import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTopbarComponent } from './search-topbar.component';

describe('SearchTopbarComponent', () => {
  let component: SearchTopbarComponent;
  let fixture: ComponentFixture<SearchTopbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchTopbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchTopbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

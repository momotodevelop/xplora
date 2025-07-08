import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardTransactionListComponent } from './card-transaction-list.component';

describe('CardTransactionListComponent', () => {
  let component: CardTransactionListComponent;
  let fixture: ComponentFixture<CardTransactionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTransactionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardTransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

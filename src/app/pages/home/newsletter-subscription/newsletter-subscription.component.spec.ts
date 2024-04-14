import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterSubscriptionComponent } from './newsletter-subscription.component';

describe('NewsletterSubscriptionComponent', () => {
  let component: NewsletterSubscriptionComponent;
  let fixture: ComponentFixture<NewsletterSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsletterSubscriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewsletterSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

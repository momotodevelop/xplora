import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLiteVouchersComponent } from './admin-lite-vouchers.component';

describe('AdminLiteVouchersComponent', () => {
  let component: AdminLiteVouchersComponent;
  let fixture: ComponentFixture<AdminLiteVouchersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLiteVouchersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLiteVouchersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

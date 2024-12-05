import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { fireGuardGuard } from './fire-guard.guard';

describe('fireGuardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => fireGuardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

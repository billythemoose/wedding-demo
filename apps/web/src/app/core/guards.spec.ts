import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type CanActivateFn,
  type GuardResult,
  type MaybeAsync,
  provideRouter,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { DemoSession } from './demo-session';
import { requireGuest, requireParty } from './guards';

function runGuard(guard: CanActivateFn): MaybeAsync<GuardResult> {
  // The demo guards ignore both arguments, so empty stand-ins are enough.
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;
  return TestBed.runInInjectionContext(() => guard(route, state));
}

function urlOf(result: MaybeAsync<GuardResult>): string {
  if (!(result instanceof UrlTree)) {
    throw new Error(`Expected a UrlTree, got ${String(result)}`);
  }
  return result.toString();
}

describe('guards', () => {
  let session: DemoSession;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    session = TestBed.inject(DemoSession);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('requireGuest', () => {
    it('redirects to / without the guest flag', () => {
      expect(urlOf(runGuard(requireGuest))).toBe('/');
    });

    it('allows the route with the guest flag', () => {
      session.setGuest();
      expect(runGuard(requireGuest)).toBeTrue();
    });
  });

  describe('requireParty', () => {
    it('redirects to /w/secret without the party flag', () => {
      expect(urlOf(runGuard(requireParty))).toBe('/w/secret');
    });

    it('allows the route with the party flag', () => {
      session.setParty();
      expect(runGuard(requireParty)).toBeTrue();
    });
  });
});

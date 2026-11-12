import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { DemoApiError, DemoApiService } from './demo-api.service';
import { DemoSession } from './demo-session';

describe('DemoApiService', () => {
  let api: DemoApiService;
  let session: DemoSession;

  beforeEach(() => {
    sessionStorage.clear();
    api = TestBed.inject(DemoApiService);
    session = TestBed.inject(DemoSession);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('fails login("wrong") with status 401 and sets no flag', fakeAsync(() => {
    let error: unknown;
    api.login('wrong').subscribe({ error: (e: unknown) => (error = e) });
    tick(1000);
    expect(error).toBeInstanceOf(DemoApiError);
    expect((error as DemoApiError).status).toBe(401);
    expect(session.isGuest()).toBeFalse();
  }));

  it('accepts any other password and sets the guest flag', fakeAsync(() => {
    let token = '';
    api.login('anything').subscribe((response) => (token = response.token));
    tick(1000);
    expect(token).toBe('demo');
    expect(session.isGuest()).toBeTrue();
  }));

  it('fails postSecret("wrong") with status 401', fakeAsync(() => {
    let error: unknown;
    api.postSecret('wrong').subscribe({ error: (e: unknown) => (error = e) });
    tick(1000);
    expect((error as DemoApiError).status).toBe(401);
    expect(session.isParty()).toBeFalse();
  }));

  it('sets the party flag on any other secret password', fakeAsync(() => {
    api.postSecret('anything').subscribe();
    tick(1000);
    expect(session.isParty()).toBeTrue();
  }));

  it('completes putRsvp without storing anything', fakeAsync(() => {
    let done = false;
    api
      .putRsvp('Jane', 'Doe', '+15095550100', true)
      .subscribe({ complete: () => (done = true) });
    tick(1000);
    expect(done).toBeTrue();
    expect(sessionStorage.length).toBe(0);
  }));
});

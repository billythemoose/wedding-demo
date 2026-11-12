import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { DemoSession } from './core/demo-session';

describe('app routes', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideToastr()],
    });
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  function url(): string {
    return TestBed.inject(Router).url;
  }

  it('shows the login page at /', async () => {
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('input[type=password]'))
      .not.toBeNull();
  });

  it('sends a new visitor from /w/rsvp to /', async () => {
    await harness.navigateByUrl('/w/rsvp');
    expect(url()).toBe('/');
  });

  it('sends a guest without the party flag from /s/secret to /w/secret', async () => {
    TestBed.inject(DemoSession).setGuest();
    await harness.navigateByUrl('/s/secret');
    expect(url()).toBe('/w/secret');
  });

  it('opens /w/rsvp for a guest, inside the site menu', async () => {
    TestBed.inject(DemoSession).setGuest();
    await harness.navigateByUrl('/w/rsvp');
    expect(url()).toBe('/w/rsvp');
    expect(harness.routeNativeElement?.querySelector('header-menu')).not.toBeNull();
  });

  it('redirects /s to /s/secret with the party flag', async () => {
    TestBed.inject(DemoSession).setParty();
    await harness.navigateByUrl('/s');
    expect(url()).toBe('/s/secret');
  });

  it('shows the not-found page for unknown URLs', async () => {
    await harness.navigateByUrl('/nope');
    expect(harness.routeNativeElement?.textContent).toContain('Page not found');
  });
});

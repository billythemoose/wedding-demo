import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { DemoSession } from './demo-session';

// Demo only. These gates run in the browser and are trivially bypassed.
// Don't copy them into the production repos.

/** Lets `/w/**` through after the login page; otherwise sends you to `/`. */
export const requireGuest: CanActivateFn = () =>
  inject(DemoSession).isGuest() || inject(Router).createUrlTree(['/']);

/** Lets `/s/**` through after the secret password; otherwise sends you to `/w/secret`. */
export const requireParty: CanActivateFn = () =>
  inject(DemoSession).isParty() || inject(Router).createUrlTree(['/w/secret']);

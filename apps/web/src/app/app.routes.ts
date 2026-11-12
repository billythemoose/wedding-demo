import type { Routes } from '@angular/router';

import { requireGuest, requireParty } from './core/guards';

/**
 * Top-level routes. The URLs match production: `/` (login), `/w/**` (site)
 * and `/s/**` (after-party).
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Login',
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'w',
    canActivate: [requireGuest],
    loadComponent: () =>
      import('./layout/site-layout/site-layout').then((m) => m.SiteLayout),
    loadChildren: () =>
      import('./site/site.routes').then((m) => m.SITE_ROUTES),
  },
  {
    path: 's',
    canActivate: [requireParty],
    loadComponent: () =>
      import('./layout/party-layout/party-layout').then((m) => m.PartyLayout),
    loadChildren: () =>
      import('./after-party/after-party.routes').then(
        (m) => m.AFTER_PARTY_ROUTES,
      ),
  },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () =>
      import('./not-found/not-found').then((m) => m.NotFound),
  },
];

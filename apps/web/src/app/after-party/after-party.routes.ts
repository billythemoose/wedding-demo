import type { Routes } from '@angular/router';

/** Child routes of `/s`: the after-party pages. */
export const AFTER_PARTY_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'secret' },
  {
    path: 'secret',
    title: 'After Party',
    loadComponent: () =>
      import('./after-party').then((m) => m.AfterPartyPage),
  },
];

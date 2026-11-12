import type { Routes } from '@angular/router';

/** Child routes of `/w`: the main wedding site. */
export const SITE_ROUTES: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  {
    path: 'party',
    title: 'Party',
    loadComponent: () => import('./party/party').then((m) => m.PartyPage),
  },
  {
    path: 'rsvp',
    title: 'RSVP',
    loadComponent: () => import('./rsvp/register').then((m) => m.RegisterPage),
  },
  {
    path: 'registry',
    title: 'Registry',
    loadComponent: () =>
      import('./registry/registry').then((m) => m.RegistryPage),
  },
  {
    path: 'story',
    title: 'Story',
    loadComponent: () => import('./story/story').then((m) => m.StoryPage),
  },
  {
    path: 'travel',
    title: 'Travel',
    loadComponent: () => import('./travel/travel').then((m) => m.TravelPage),
  },
  {
    path: 'secret',
    title: 'Secrets',
    loadComponent: () => import('./secret/secret').then((m) => m.SecretPage),
  },
];

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderMenu } from '../header-menu/header-menu';
import { PARTY_LINKS } from '../menu-links';

/** Shell for `/s/**`: the after-party menu above the page. */
@Component({
  selector: 'party-layout',
  imports: [HeaderMenu, RouterOutlet],
  template: `
    <header-menu [links]="links" />
    <router-outlet />
  `,
})
export class PartyLayout {
  protected readonly links = PARTY_LINKS;
}

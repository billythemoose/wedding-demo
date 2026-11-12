import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderMenu } from '../header-menu/header-menu';
import { SITE_LINKS } from '../menu-links';

/** Shell for `/w/**`: the site menu above the page. */
@Component({
  selector: 'site-layout',
  imports: [HeaderMenu, RouterOutlet],
  template: `
    <header-menu [links]="links" />
    <router-outlet />
  `,
  // Fills the space under the demo banner, so full-height pages like
  // /w/secret can use flex: 1 instead of 100vh.
  styles: `
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `,
})
export class SiteLayout {
  protected readonly links = SITE_LINKS;
}

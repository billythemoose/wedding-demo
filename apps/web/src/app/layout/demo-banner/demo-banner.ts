import { Component } from '@angular/core';

/** One-line notice at the top of every page. */
@Component({
  selector: 'demo-banner',
  template: `
    <p class="demo-banner" role="note">
      Demo: any password works (except "wrong"), nothing is saved
    </p>
  `,
  styles: `
    .demo-banner {
      margin: 0;
      padding: 0.25rem 1rem;
      background: #333;
      color: #fff;
      font-size: 0.8rem;
      text-align: center;
    }
  `,
})
export class DemoBanner {}

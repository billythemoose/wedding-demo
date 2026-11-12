import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Catch-all page for unknown URLs. */
@Component({
  selector: 'not-found',
  imports: [RouterLink],
  template: `
    <main class="not-found">
      <h1>Page not found</h1>
      <p><a routerLink="/">Back to the start</a></p>
    </main>
  `,
  styles: `
    .not-found {
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class NotFound {}

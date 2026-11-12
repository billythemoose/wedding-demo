import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DemoBanner } from './layout/demo-banner/demo-banner';

/** Root component. Each layout under it brings its own menu. */
@Component({
  selector: 'app-root',
  imports: [DemoBanner, RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {}

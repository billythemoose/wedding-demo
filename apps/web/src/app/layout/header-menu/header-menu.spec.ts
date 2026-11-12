import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderMenu, type MenuLink } from './header-menu';

describe('HeaderMenu', () => {
  it('renders the links it is given', async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderMenu],
      providers: [provideRouter([])],
    }).compileComponents();

    const links: MenuLink[] = [
      { label: 'Home', path: '/w' },
      { label: 'RSVP', path: '/w/rsvp' },
    ];
    const fixture = TestBed.createComponent(HeaderMenu);
    fixture.componentRef.setInput('links', links);
    fixture.detectChanges();

    const anchors: HTMLAnchorElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a.nav-item'),
    );
    expect(anchors.map((a) => a.textContent?.trim())).toEqual(['Home', 'RSVP']);
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      '/w',
      '/w/rsvp',
    ]);
  });
});

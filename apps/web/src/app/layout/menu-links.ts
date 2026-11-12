import { MenuLink } from "./header-menu/header-menu";

// The two menus. Phase 4's SiteLayout and PartyLayout pass these to <header-menu>.
export const SITE_LINKS: MenuLink[] = [
    { label: 'Home', path: '/w' },
    { label: 'Party', path: '/w/party' },
    { label: 'RSVP', path: '/w/rsvp' },
    { label: 'Our Story', path: '/w/story' },
    { label: 'Travel & Stay', path: '/w/travel' },
    { label: 'Registry', path: '/w/registry' },
    { label: '\u{1F92B}', path: '/w/secret' },
];

export const PARTY_LINKS: MenuLink[] = [
    { label: 'Home', path: '/w' },
    { label: '\u{1F92B}', path: '/s/secret' },
];

import { Injectable } from '@angular/core';

const GUEST_KEY = 'demo-guest';
const PARTY_KEY = 'demo-party';

/**
 * Remembers which demo passwords this tab has entered. Uses `sessionStorage`,
 * which is per tab and clears when the tab closes.
 */
@Injectable({ providedIn: 'root' })
export class DemoSession {
  isGuest(): boolean {
    return sessionStorage.getItem(GUEST_KEY) === 'true';
  }

  setGuest(): void {
    sessionStorage.setItem(GUEST_KEY, 'true');
  }

  isParty(): boolean {
    return sessionStorage.getItem(PARTY_KEY) === 'true';
  }

  setParty(): void {
    sessionStorage.setItem(PARTY_KEY, 'true');
  }
}

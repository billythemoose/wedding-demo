import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, switchMap, tap, throwError, timer } from 'rxjs';

import { DemoSession } from './demo-session';

/** Fake network delay, so the loading states are visible. */
const LATENCY_MS = 600;

/** The one password that fails, so the error toast can be seen on purpose. */
const WRONG_PASSWORD = 'wrong';

/** Error shaped like the HTTP errors the components already check (`err.status`). */
export class DemoApiError extends Error {
  constructor(readonly status: number) {
    super(`Demo API error ${status}`);
    this.name = 'DemoApiError';
  }
}

/** Response from a successful login. */
export interface LoginResponse {
  token: string;
}

/**
 * Stands in for the production API. Same method names as the old `ApiService`
 * and `AuthService`, but nothing leaves the browser: logins set flags in
 * `DemoSession` and RSVPs are discarded.
 */
@Injectable({ providedIn: 'root' })
export class DemoApiService {
  private readonly session = inject(DemoSession);

  /** Accepts any password except `wrong`, and marks the tab as a guest. */
  login(password: string): Observable<LoginResponse> {
    if (password === WRONG_PASSWORD) {
      return failAfterDelay(401);
    }
    return of({ token: 'demo' }).pipe(
      delay(LATENCY_MS),
      tap(() => {
        this.session.setGuest();
      }),
    );
  }

  /** Pretends to save one person's RSVP. Nothing is stored. */
  putRsvp(
    _firstName: string,
    _lastName: string,
    _phone: string,
    _attending: boolean,
  ): Observable<void> {
    return of(undefined).pipe(delay(LATENCY_MS));
  }

  /** Accepts any password except `wrong`, and unlocks the after-party. */
  postSecret(password: string): Observable<void> {
    if (password === WRONG_PASSWORD) {
      return failAfterDelay(401);
    }
    return of(undefined).pipe(
      delay(LATENCY_MS),
      tap(() => {
        this.session.setParty();
      }),
    );
  }
}

function failAfterDelay(status: number): Observable<never> {
  return timer(LATENCY_MS).pipe(
    switchMap(() => throwError(() => new DemoApiError(status))),
  );
}

import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { AuthService as Auth0Service, User } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { concatMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth0 = inject(Auth0Service);
  private document = inject(DOCUMENT);
  private http = inject(HttpClient);

  isAuthenticated = signal<boolean>(false);
  user = signal<any>(null);
  user$ = toObservable(this.user);

  constructor() {
    // Subscribe to Auth0 authentication state
    this.auth0.isAuthenticated$.subscribe((isAuthenticated) => {
      this.isAuthenticated.set(isAuthenticated);
    });

    // Fetch user data when authenticated
    this.auth0.user$
      .pipe(
        concatMap((user) =>
          this.http.get(
            encodeURI(`${environment.auth0.audience}users/${user?.sub}`),
          ),
        ),
        tap((user) => this.user.set(user)),
      )
      .subscribe();
  }

  login(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: this.document.location.origin,
      },
    });
  }

  getUser(): Observable<any> {
    return this.user$;
  }

  updateUserMetadata(userId: string, metadata: any): Observable<any> {
    return this.http
      .patch(
        `${environment.auth0.audience}users/${userId}`,
        { user_metadata: metadata },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(tap((updatedUser) => this.user.set(updatedUser)));
  }
}

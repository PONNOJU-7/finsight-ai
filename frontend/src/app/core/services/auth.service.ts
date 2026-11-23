import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser { id: string; email: string; name: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'finsight_token';
  private readonly USER_KEY = 'finsight_user';
  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  register(name: string, email: string, password: string) {
    return this.http.post<{ accessToken: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/register`, { name, email, password },
    ).pipe(tap(res => this.saveSession(res)));
  }

  login(email: string, password: string) {
    return this.http.post<{ accessToken: string; user: AuthUser }>(
      `${environment.apiUrl}/auth/login`, { email, password },
    ).pipe(tap(res => this.saveSession(res)));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return !!this.getToken(); }
  getToken(): string | null { return localStorage.getItem(this.TOKEN_KEY); }

  private saveSession(res: { accessToken: string; user: AuthUser }) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private loadUser(): AuthUser | null {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY) ?? 'null'); }
    catch { return null; }
  }
}

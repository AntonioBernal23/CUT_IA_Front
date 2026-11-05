import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  picture: string;
  role: string;
}

export type AuthUser = Omit<AuthResponse, 'token'>;

interface JwtPayload {
  sub: string;
  role?: string;
  name?: string;
  iat?: number;
  exp: number;
}

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private logoutTimer?: ReturnType<typeof setTimeout>;

  // Estado reactivo (solo para UX, no para seguridad)
  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  readonly roles = computed(() => {
    this.user(); // se recalcula cuando cambia la sesión
    return this.getRoles();
  });

  hasRoleSignal(...required: string[]) {
    return computed(() => required.some(r => this.roles().includes(r.replace(/^ROLE_/, ''))));
  }

  constructor() {
    this.restoreFromStorage();

    // Si se cierra sesión en otra pestaña, se cierra en todas
    window.addEventListener('storage', e => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        this.clearSession();
        void this.router.navigate(['/login']);
      }
    });
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google`, { idToken })
      .pipe(tap(res => this.saveSession(res)));
  }

  /** Devuelve el token solo si existe y no ha vencido. Si venció, limpia todo. */
  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    if (this.isExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /** El rol se lee del JWT, NO del objeto 'user' de localStorage (ese se puede editar) */
  getRoles(): string[] {
    const token = this.getToken();
    const payload = token ? decodeJwt(token) : null;
    const role = payload?.role;
    return typeof role === 'string' ? [role.replace(/^ROLE_/, '')] : [];
  }

  hasRole(...required: string[]): boolean {
    const roles = this.getRoles();
    return required.some(r => roles.includes(r.replace(/^ROLE_/, '')));
  }

  /**
   * Se ejecuta al arrancar/recargar la app.
   * Valida expiración local y confirma con el backend (GET /auth/me).
   */
  verifySession(): Observable<boolean> {
    if (!this.getToken()) return of(false);

    return this.http.get<AuthUser>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  logout(redirect = true): void {
    this.clearSession();
    if (redirect) void this.router.navigate(['/login']);
  }

  // ---------- privados ----------

  private saveSession(res: AuthResponse): void {
    const { token, ...user } = res;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
    this.scheduleExpiry(token);
  }

  private restoreFromStorage(): void {
    const token = this.getToken(); // ya limpia si venció
    if (!token) return;

    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) this._user.set(JSON.parse(raw) as AuthUser);
    } catch {
      this.clearSession();
      return;
    }
    this.scheduleExpiry(token);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    clearTimeout(this.logoutTimer);
  }

  private isExpired(token: string): boolean {
    const payload = decodeJwt(token);
    if (!payload?.exp) return true; // sin exp o ilegible = inválido
    return payload.exp * 1000 <= Date.now();
  }

  /** Cierra sesión automáticamente en el momento exacto en que vence */
  private scheduleExpiry(token: string): void {
    clearTimeout(this.logoutTimer);
    const payload = decodeJwt(token);
    if (!payload?.exp) return;

    const ms = payload.exp * 1000 - Date.now();
    // setTimeout tiene un límite de ~24.8 días; con JWTs normales no es problema
    this.logoutTimer = setTimeout(() => this.logout(), Math.max(ms, 0));
  }
}
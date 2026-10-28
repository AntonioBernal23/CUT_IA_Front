import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  picture: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google`, { idToken })
      .pipe(
        tap(response => {
          localStorage.setItem('access_token', response.token);

          localStorage.setItem(
            'user',
            JSON.stringify({
              email: response.email,
              name: response.name,
              picture: response.picture,
              role: response.role
            })
          );
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUser(): AuthResponse | null {
    const user = localStorage.getItem('user');

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthResponse;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
}
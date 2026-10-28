import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

declare const google: {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          theme: string;
          size: string;
          shape: string;
          text: string;
          width: number;
        }
      ) => void;
    };
  };
};

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html'
})
export class Login implements AfterViewInit {
  @ViewChild('googleButton')
  googleButton!: ElementRef<HTMLDivElement>;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  error = '';
  loading = false;

  ngAfterViewInit(): void {
    if (typeof google === 'undefined') {
      this.error =
        'No se pudo cargar Google. Recarga la página e inténtalo de nuevo.';
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => {
        if (response.credential) {
          this.login(response.credential);
        } else {
          this.error = 'Google no devolvió un token válido.';
        }
      }
    });

    google.accounts.id.renderButton(
      this.googleButton.nativeElement,
      {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        width: 280
      }
    );
  }

  private login(googleIdToken: string): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.loginWithGoogle(googleIdToken).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;

        this.error =
          err.error?.message ??
          err.error?.detail ??
          'No se pudo iniciar sesión. Verifica el backend.';
      }
    });
  }
}
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  host: { class: 'contents' }, // para que el header sticky funcione dentro del layout
})
export class Navbar {
  private router = inject(Router);
  menuOpen = signal(false);

  readonly auth = inject(AuthService);

  logout() {
    // Ajusta esto a tu AuthService / nombre de tu token
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.menuOpen.set(false);
    this.router.navigate(['/login']);
  }
}
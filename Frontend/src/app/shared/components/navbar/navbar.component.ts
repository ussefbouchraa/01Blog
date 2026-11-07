// Purpose: Navigation bar component.
// Displays app links, auth buttons (login/register/logout), and user info based on auth state

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand fw-bold" routerLink="/posts">01Blog</a>
        <button
          class="navbar-toggler"
          type="button"
          (click)="menuOpen = !menuOpen"
          [attr.aria-expanded]="menuOpen"
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="menuOpen">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link" routerLink="/posts" routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: true }">Home</a>
            </li>
            @if (isLoggedIn()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/posts/create" routerLinkActive="active">Create Post</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/notifications" routerLinkActive="active">
                  Notifications
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/users/me" routerLinkActive="active">Profile</a>
              </li>
              @if (isAdmin()) {
                <li class="nav-item">
                  <a class="nav-link" routerLink="/admin" routerLinkActive="active">Admin</a>
                </li>
              }
            }
          </ul>

          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            @if (isLoggedIn()) {
              <li class="nav-item">
                <span class="navbar-text me-3 text-light">
                  <i class="bi bi-person-circle me-1"></i>{{ username() }}
                </span>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" (click)="logout($event)">Logout</a>
              </li>
            } @else {
              <li class="nav-item">
                <a class="nav-link" routerLink="/login" routerLinkActive="active">Login</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/register" routerLinkActive="active">Register</a>
              </li>
            }
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: []
})
export class NavbarComponent {
  menuOpen = false;

  constructor(private auth: AuthService, private router: Router) {}

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  isAdmin(): boolean {
    const role = this.auth.getRole();
    return role === 'ROLE_ADMIN';
  }

  username(): string {
    return this.auth.getUsername();
  }

  logout(event: Event): void {
    event.preventDefault();
    this.auth.logout();
    this.menuOpen = false;
    this.router.navigate(['/login']);
  }
}

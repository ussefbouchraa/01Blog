// Purpose: Navigation bar component.
// Displays app links, user avatar dropdown (Profile, Settings, Logout), and auth buttons.
// Matches the modern navbar design from the wireframe screenshot.
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../features/users/users.service';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SettingsModalComponent],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark py-2" style="background-color: #1e293b;">
      <div class="container px-4">
        <a class="navbar-brand fw-bold fs-4 me-4" routerLink="/home" style="letter-spacing: -0.5px;">01Blog</a>

        <div class="d-flex align-items-center ms-auto gap-3">
          @if (isLoggedIn()) {
            <!-- Search icon -->
            <a class="text-white-50 text-decoration-none p-1 hover-light" href="#" title="Search" (click)="$event.preventDefault()">
              <i class="bi bi-search fs-5"></i>
            </a>

            <!-- Notifications icon -->
            <a class="text-white-50 text-decoration-none p-1 hover-light" routerLink="/notifications" title="Notifications">
              <i class="bi bi-bell fs-5"></i>
            </a>

            <!-- User avatar dropdown -->
            <div class="dropdown user-dropdown-container">
              <a
                class="d-flex align-items-center p-0 rounded-circle text-decoration-none"
                href="#"
                id="navbarUserDropdown"
                role="button"
                aria-expanded="false"
                (click)="toggleDropdown($event)">
                @if (avatarUrl) {
                  <img
                    [src]="usersService.getAvatarUrl(avatarUrl)"
                    alt="Avatar"
                    class="rounded-circle object-fit-cover shadow-sm"
                    width="34"
                    height="34" />
                } @else {
                  <div
                    class="rounded-circle d-flex align-items-center justify-content-center text-white shadow-sm"
                    style="width: 34px; height: 34px; background-color: #334155;">
                    <i class="bi bi-person-circle fs-4"></i>
                  </div>
                }
              </a>
              <ul
                class="dropdown-menu dropdown-menu-end shadow border-0 mt-2"
                [class.show]="dropdownOpen"
                style="border-radius: 10px; min-width: 200px;">
                <li class="px-3 py-2 border-bottom">
                  <div class="fw-bold small">{{ username() }}</div>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center py-2"
                     routerLink="/users/me"
                     (click)="closeDropdown()">
                    <i class="bi bi-person me-2 text-muted"></i>Profile
                  </a>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center py-2"
                     href="#"
                     (click)="openSettings($event)">
                    <i class="bi bi-gear me-2 text-muted"></i>Settings
                  </a>
                </li>
                @if (isAdmin()) {
                  <li>
                    <a class="dropdown-item d-flex align-items-center py-2"
                       routerLink="/admin"
                       (click)="closeDropdown()">
                      <i class="bi bi-shield-lock me-2 text-muted"></i>Admin Panel
                    </a>
                  </li>
                }
                <li><hr class="dropdown-divider my-1"></li>
                <li>
                  <a class="dropdown-item d-flex align-items-center py-2 text-danger"
                     href="#"
                     (click)="logout($event)">
                    <i class="bi bi-box-arrow-right me-2"></i>Logout
                  </a>
                </li>
              </ul>
            </div>
          } @else {
            <a class="btn btn-sm btn-outline-light" routerLink="/login">Login</a>
            <a class="btn btn-sm btn-primary" routerLink="/register">Register</a>
          }
        </div>
      </div>
    </nav>

    <!-- Settings Modal -->
    <app-settings-modal
      #settingsModal
      (closed)="onSettingsClose()"
      (profileUpdated)="onProfileUpdated()">
    </app-settings-modal>
  `,
  styles: [`
    :host {
      display: block;
    }
    .user-dropdown-container {
      position: relative;
    }
    .hover-light:hover {
      color: #ffffff !important;
    }
    .dropdown-menu {
      animation: fadeIn 0.15s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NavbarComponent implements OnInit {
  @ViewChild('settingsModal') settingsModal!: SettingsModalComponent;

  menuOpen = false;
  dropdownOpen = false;
  avatarUrl: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    public usersService: UsersService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadUserAvatar();
    }
  }

  loadUserAvatar(): void {
    const userId = this.auth.getUserId();
    if (userId) {
      this.usersService.getUserById(userId).subscribe({
        next: (user) => {
          this.avatarUrl = user.avatarUrl || null;
        },
        error: () => {}
      });
    }
  }

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

  toggleDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.dropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.dropdownOpen = false;
    }
  }

  openSettings(event: Event): void {
    event.preventDefault();
    this.closeDropdown();
    this.settingsModal.open();
  }

  onSettingsClose(): void {
    // Modal closed
  }

  onProfileUpdated(): void {
    this.loadUserAvatar();
  }

  logout(event: Event): void {
    event.preventDefault();
    this.closeDropdown();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

// Purpose: Navigation bar component.
// Displays app links, user avatar dropdown (Profile, Settings, Logout), and auth buttons.
// Matches the modern navbar design from the wireframe screenshot.
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationResponse } from '../../../core/models';
import { UsersService } from '../../../features/users/users.service';
import { NotificationApiService } from '../../../features/notifications/notification-api.service';
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

            <!-- Notifications dropdown -->
            <div class="dropdown notification-dropdown-container">
              <button
                type="button"
                class="btn btn-link text-white-50 text-decoration-none p-1 hover-light position-relative"
                title="Notifications"
                aria-label="Notifications"
                aria-haspopup="true"
                [attr.aria-expanded]="notificationDropdownOpen"
                (click)="toggleNotificationDropdown($event)">
                <i class="bi bi-bell fs-5"></i>
                @if (unreadCount > 0) {
                  <span class="notification-badge badge rounded-pill bg-danger">
                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                    <span class="visually-hidden">unread notifications</span>
                  </span>
                }
              </button>

              <div
                class="dropdown-menu dropdown-menu-end notification-menu shadow border-0 mt-2 p-0"
                [class.show]="notificationDropdownOpen">
                <div class="d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
                  <h6 class="fw-bold mb-0">Notifications</h6>
                  @if (unreadCount > 0) {
                    <span class="badge bg-danger rounded-pill">{{ unreadCount }} unread</span>
                  }
                </div>

                @if (notificationsLoading) {
                  <div class="text-center text-muted py-4">
                    <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                    <span class="small ms-2">Loading notifications...</span>
                  </div>
                } @else if (notificationsError) {
                  <div class="text-center px-3 py-4">
                    <p class="small text-danger mb-2">{{ notificationsError }}</p>
                    <button type="button" class="btn btn-sm btn-outline-primary" (click)="loadNotifications()">
                      Try again
                    </button>
                  </div>
                } @else if (notifications.length === 0) {
                  <div class="text-center text-muted px-3 py-4">
                    <i class="bi bi-bell-slash fs-3 d-block mb-2"></i>
                    <p class="small mb-0">You have no notifications yet.</p>
                  </div>
                } @else {
                  <div class="notification-list">
                    @for (notification of notifications; track notification.id) {
                      <button
                        type="button"
                        class="dropdown-item notification-item d-flex align-items-start gap-3 px-3 py-3 border-bottom"
                        [class.notification-unread]="!notification.isRead"
                        [disabled]="isMarkingAsRead(notification.id)"
                        (click)="selectNotification(notification)">
                        <span class="notification-icon d-flex align-items-center justify-content-center flex-shrink-0">
                          <i class="bi" [ngClass]="notificationIcon(notification.type)"></i>
                        </span>
                        <span class="flex-grow-1 overflow-hidden">
                          <span class="d-flex align-items-start gap-2">
                            <span class="notification-message flex-grow-1">{{ notification.message }}</span>
                            @if (!notification.isRead) {
                              <span class="unread-dot bg-primary flex-shrink-0 mt-2"></span>
                            }
                          </span>
                          <span class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                            {{ notification.createdAt | date:'short' }}
                          </span>
                        </span>
                      </button>
                    }
                  </div>
                }
              </div>
            </div>

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
    .notification-dropdown-container {
      position: relative;
    }
    .notification-badge {
      position: absolute;
      top: -0.2rem;
      right: -0.65rem;
      min-width: 1.15rem;
      padding: 0.25rem 0.35rem;
      font-size: 0.65rem;
    }
    .notification-menu {
      width: min(390px, calc(100vw - 2rem));
      border-radius: 12px;
      overflow: hidden;
    }
    .notification-list {
      max-height: 420px;
      overflow-y: auto;
    }
    .notification-item {
      white-space: normal;
      transition: background-color 0.15s ease-in-out;
    }
    .notification-item:last-child {
      border-bottom: 0 !important;
    }
    .notification-item:disabled {
      opacity: 0.75;
    }
    .notification-unread {
      background-color: #eef6ff;
    }
    .notification-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background-color: #f1f5f9;
    }
    .notification-message {
      color: #1e293b;
      font-size: 0.875rem;
      line-height: 1.35;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
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
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('settingsModal') settingsModal!: SettingsModalComponent;

  menuOpen = false;
  dropdownOpen = false;
  notificationDropdownOpen = false;
  avatarUrl: string | null = null;
  notifications: NotificationResponse[] = [];
  unreadCount = 0;
  notificationsLoading = false;
  notificationsError = '';
  private markingAsReadIds = new Set<number>();
  private avatarUpdateSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    public usersService: UsersService,
    private notificationApiService: NotificationApiService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadUserAvatar();
      this.avatarUpdateSubscription = this.usersService.avatarUpdated$.subscribe(() => this.loadUserAvatar());
      this.refreshUnreadCount();
    }

    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.onNavigationEnd());
  }

  ngOnDestroy(): void {
    this.avatarUpdateSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
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
    this.notificationDropdownOpen = false;
    this.dropdownOpen = !this.dropdownOpen;
  }

  closeDropdown(): void {
    this.dropdownOpen = false;
    this.notificationDropdownOpen = false;
    this.menuOpen = false;
  }

  toggleNotificationDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = false;
    this.notificationDropdownOpen = !this.notificationDropdownOpen;

    if (this.notificationDropdownOpen) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    if (!this.isLoggedIn()) return;

    this.notificationsLoading = true;
    this.notificationsError = '';
    this.notificationApiService.getAll().subscribe({
      next: (notifications) => {
        this.notifications = notifications || [];
        this.unreadCount = this.notifications.filter((notification) => !notification.isRead).length;
        this.notificationsLoading = false;
      },
      error: () => {
        this.notificationsLoading = false;
        this.notificationsError = 'Could not load notifications.';
      }
    });
  }

  selectNotification(notification: NotificationResponse): void {
    if (this.isMarkingAsRead(notification.id)) return;

    if (notification.isRead) {
      this.navigateToRelatedPost(notification);
      return;
    }

    const previousUnreadCount = this.unreadCount;
    this.notifications = this.notifications.map((item) =>
      item.id === notification.id ? { ...item, isRead: true } : item
    );
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    this.setMarkingAsRead(notification.id, true);

    this.notificationApiService.markAsRead(notification.id).subscribe({
      next: () => {
        this.setMarkingAsRead(notification.id, false);
        this.navigateToRelatedPost(notification);
      },
      error: () => {
        this.notifications = this.notifications.map((item) =>
          item.id === notification.id ? { ...item, isRead: false } : item
        );
        this.unreadCount = previousUnreadCount;
        this.setMarkingAsRead(notification.id, false);
      }
    });
  }

  isMarkingAsRead(notificationId: number): boolean {
    return this.markingAsReadIds.has(notificationId);
  }

  notificationIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'like':
        return 'bi-heart-fill text-danger';
      case 'comment':
        return 'bi-chat-fill text-primary';
      case 'follow':
        return 'bi-person-plus-fill text-success';
      case 'new_post':
        return 'bi-file-earmark-post-fill text-primary';
      default:
        return 'bi-bell-fill text-secondary';
    }
  }

  private refreshUnreadCount(): void {
    if (!this.isLoggedIn()) {
      this.unreadCount = 0;
      return;
    }

    this.notificationApiService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = Number(count) || 0;
      },
      error: () => {}
    });
  }

  private onNavigationEnd(): void {
    if (!this.isLoggedIn()) {
      this.notifications = [];
      this.unreadCount = 0;
      this.notificationDropdownOpen = false;
      return;
    }

    this.refreshUnreadCount();
    this.notificationDropdownOpen = false;
  }

  private navigateToRelatedPost(notification: NotificationResponse): void {
    if (notification.relatedPost?.id) {
      this.notificationDropdownOpen = false;
      this.router.navigate(['/posts', notification.relatedPost.id]);
    }
  }

  private setMarkingAsRead(notificationId: number, marking: boolean): void {
    const ids = new Set(this.markingAsReadIds);
    if (marking) {
      ids.add(notificationId);
    } else {
      ids.delete(notificationId);
    }
    this.markingAsReadIds = ids;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      (this.dropdownOpen || this.notificationDropdownOpen) &&
      !this.elementRef.nativeElement.contains(event.target)
    ) {
      this.dropdownOpen = false;
      this.notificationDropdownOpen = false;
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

// Purpose: Admin — manage users tab.
// Lists every account (ID, username, role, joined) and lets an admin delete one
// after confirmation. Data comes from GET /api/admin/users and DELETE /api/admin/users/{id}.
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="card shadow-sm border-0">
      <div class="card-header bg-white border-0 pt-3 px-4 d-flex align-items-center justify-content-between">
        <h5 class="fw-bold mb-0">
          <i class="bi bi-people me-2 text-primary"></i>All Users
          <span class="badge bg-secondary ms-1">{{ users.length }}</span>
        </h5>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
          [disabled]="loading"
          (click)="loadUsers()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div class="card-body px-4 pb-4 pt-3">
        @if (loading) {
          <app-loading message="Loading users..."></app-loading>
        }

        @if (error && !loading) {
          <div class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="loadUsers()">Retry</button>
          </div>
        }

        @if (!loading && !error && users.length === 0) {
          <p class="text-muted text-center py-4 mb-0">No users found.</p>
        }

        @if (!loading && !error && users.length > 0) {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="text-muted small text-uppercase">
                  <th scope="col">ID</th>
                  <th scope="col">Username</th>
                  <th scope="col">Role</th>
                  <th scope="col">Joined</th>
                  <th scope="col" class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users; track user.id) {
                  <tr>
                    <td class="text-muted">{{ user.id }}</td>
                    <td class="fw-semibold">
                      <a [routerLink]="['/users', user.id]" class="text-decoration-none">
                        {{ user.username }}
                      </a>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="isAdminRole(user) ? 'bg-danger' : 'bg-secondary'">
                        {{ isAdminRole(user) ? 'Admin' : 'User' }}
                      </span>
                    </td>
                    <td class="text-muted small">{{ user.createdAt | date:'mediumDate' }}</td>
                    <td class="text-end">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        [disabled]="isSelf(user) || deleteLoading"
                        [title]="isSelf(user) ? 'You cannot delete your own account' : 'Delete user'"
                        (click)="promptDelete(user)">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <app-confirm-modal
      #confirmModal
      title="Delete User"
      message="Are you sure you want to delete this user? Their posts, comments, likes and follows will be removed permanently."
      confirmText="Yes, Delete User"
      [loading]="deleteLoading"
      (confirmed)="onDeleteConfirm()"
      (cancelled)="cancelDelete()">
    </app-confirm-modal>
  `,
  styles: []
})
export class UsersTabComponent implements OnInit {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  users: UserResponse[] = [];
  loading = true;
  error = '';
  deleteLoading = false;
  private pendingDeleteUser: UserResponse | null = null;
  private currentUserId: number | null = null;

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.api.get<UserResponse[]>('/admin/users').subscribe({
      next: (users) => {
        this.users = users || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Could not load users.';
      }
    });
  }

  isAdminRole(user: UserResponse): boolean {
    return (user.role || '').toUpperCase().includes('ADMIN');
  }

  isSelf(user: UserResponse): boolean {
    return this.currentUserId !== null && user.id === this.currentUserId;
  }

  promptDelete(user: UserResponse): void {
    if (this.isSelf(user) || this.deleteLoading) return;
    this.pendingDeleteUser = user;
    this.confirmModal.show();
  }

  cancelDelete(): void {
    if (!this.deleteLoading) {
      this.pendingDeleteUser = null;
    }
  }

  onDeleteConfirm(): void {
    const target = this.pendingDeleteUser;
    if (!target || this.deleteLoading) return;

    this.deleteLoading = true;
    this.api.delete<void>(`/admin/users/${target.id}`).subscribe({
      next: () => {
        this.users = this.users.filter((user) => user.id !== target.id);
        this.pendingDeleteUser = null;
        this.deleteLoading = false;
        this.confirmModal.close();
        this.notificationService.success(`User ${target.username} deleted.`);
      },
      error: (err) => {
        this.deleteLoading = false;
        this.notificationService.error(err.error?.message || 'Could not delete user.');
      }
    });
  }
}

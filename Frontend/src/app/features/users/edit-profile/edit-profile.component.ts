// Purpose: Edit profile page component.
// Loads current user profile data and displays editable profile fields (username, bio, avatar).
// Note: Backend endpoint PUT /api/users/{id} is designated in the roadmap as Backend Change BC1.
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-7">
        <!-- Back Link -->
        <div class="mb-3">
          <a routerLink="/users/me" class="btn btn-sm btn-link text-decoration-none text-muted p-0">
            <i class="bi bi-arrow-left me-1"></i>Back to My Profile
          </a>
        </div>

        <!-- Loading State -->
        @if (loading) {
          <app-loading message="Loading profile..."></app-loading>
        }

        @if (!loading) {
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <!-- Header -->
              <div class="d-flex align-items-center mb-4">
                <div
                  class="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center"
                  style="width: 48px; height: 48px;">
                  <i class="bi bi-person-gear fs-4"></i>
                </div>
                <div>
                  <h3 class="card-title fw-bold mb-0">Edit Profile</h3>
                  <p class="text-muted small mb-0">Manage your public blogging persona.</p>
                </div>
              </div>

              <!-- Backend Status Notice (BC1) -->
              <div class="alert alert-warning d-flex align-items-start mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 mt-1"></i>
                <div class="small">
                  <strong>Backend Notice:</strong> Profile updates require backend support (<code>PUT /api/users/&#123;id&#125;</code>).
                  Your current profile information is displayed below.
                </div>
              </div>

              <form [formGroup]="form" (ngSubmit)="submit()">
                <!-- Avatar Preview -->
                <div class="mb-4 text-center text-md-start d-flex flex-column flex-md-row align-items-center gap-3">
                  @if (user?.avatarUrl) {
                    <img
                      [src]="usersService.getAvatarUrl(user?.avatarUrl)"
                      alt="Avatar"
                      class="rounded-circle shadow-sm object-fit-cover"
                      width="80"
                      height="80" />
                  } @else {
                    <div
                      class="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary shadow-sm"
                      style="width: 80px; height: 80px;">
                      <i class="bi bi-person-fill display-5"></i>
                    </div>
                  }
                  <div>
                    <h6 class="fw-bold mb-1">{{ user?.username }}</h6>
                    <span class="text-muted small">
                      Member since {{ user?.createdAt | date:'mediumDate' }}
                    </span>
                  </div>
                </div>

                <!-- Username (read-only for security / unique constraint) -->
                <div class="mb-3">
                  <label for="usernameInput" class="form-label fw-semibold">Username</label>
                  <input
                    id="usernameInput"
                    type="text"
                    class="form-control bg-light"
                    formControlName="username"
                    readonly />
                  <div class="form-text small">Usernames are permanent and unique identifiers.</div>
                </div>

                <!-- Bio -->
                <div class="mb-3">
                  <label for="bioInput" class="form-label fw-semibold">Bio</label>
                  <textarea
                    id="bioInput"
                    rows="4"
                    class="form-control"
                    formControlName="bio"
                    placeholder="Tell the community about yourself, your goals, or what you are learning..."></textarea>
                </div>

                <!-- Actions -->
                <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                  <a routerLink="/users/me" class="btn btn-outline-secondary">
                    Cancel
                  </a>
                  <button
                    type="submit"
                    class="btn btn-primary d-inline-flex align-items-center"
                    [disabled]="saving">
                    @if (saving) {
                      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    } @else {
                      <i class="bi bi-check-lg me-1"></i>Save Changes
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class EditProfileComponent implements OnInit {
  form: FormGroup;
  user: UserResponse | null = null;
  loading = true;
  saving = false;

  constructor(
    private fb: FormBuilder,
    public usersService: UsersService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: [{ value: '', disabled: false }, [Validators.required]],
      bio: ['']
    });
  }

  ngOnInit(): void {
    const currentUserId = this.authService.getUserId();
    if (!currentUserId) {
      this.notificationService.error('You must be logged in to edit your profile.');
      this.router.navigate(['/login']);
      return;
    }

    this.usersService.getUserById(currentUserId).subscribe({
      next: (userData) => {
        this.user = userData;
        this.form.patchValue({
          username: userData.username,
          bio: userData.bio || ''
        });
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Could not load user profile.');
        this.router.navigate(['/users/me']);
      }
    });
  }

  submit(): void {
    // When backend endpoint PUT /api/users/{id} is ready, call it here.
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.notificationService.info(
        'Backend update endpoint (PUT /api/users/{id}) is pending backend release. Changes cannot be persisted yet.'
      );
    }, 600);
  }
}

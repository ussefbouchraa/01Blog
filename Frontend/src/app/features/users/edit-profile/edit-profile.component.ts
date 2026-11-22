// Purpose: Edit profile page component.
// Loads current user profile data and allows updating profile fields (username, bio)
// plus uploading a new avatar. Email is display-only. Connects to PUT /api/users/{id}, POST /api/users/{id}/avatar
// and GET /api/users/me.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsersService } from '../users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnUserProfileResponse, UpdateUserRequest } from '../../../core/models';
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

              <form [formGroup]="form" (ngSubmit)="submit()">
                <!-- Avatar upload with live preview -->
                <div class="mb-4 text-center text-md-start d-flex flex-column flex-md-row align-items-center gap-3">
                  @if (avatarPreviewUrl) {
                    <img
                      [src]="avatarPreviewUrl"
                      alt="Avatar preview"
                      class="rounded-circle shadow-sm object-fit-cover"
                      width="80"
                      height="80" />
                  } @else if (user?.avatarUrl) {
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
                    <div class="d-flex align-items-center gap-2 mt-2">
                      <input
                        #avatarInput
                        id="avatarFileInput"
                        type="file"
                        class="form-control form-control-sm"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        (change)="onAvatarSelected($event)" />
                      @if (selectedAvatarFile) {
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-secondary text-nowrap"
                          (click)="clearAvatarSelection(avatarInput)">
                          Clear
                        </button>
                      }
                    </div>
                    <div class="form-text small">JPEG, PNG, GIF or WebP, up to 5 MB. Saved when you click Save Changes.</div>
                    @if (avatarError) {
                      <div class="text-danger small mt-1">{{ avatarError }}</div>
                    }
                  </div>
                </div>

                <!-- Username -->
                <div class="mb-3">
                  <label for="usernameInput" class="form-label fw-semibold">Username</label>
                  <input
                    id="usernameInput"
                    type="text"
                    class="form-control"
                    formControlName="username" />
                  @if (form.get('username')?.touched && form.get('username')?.hasError('required')) {
                    <div class="text-danger small mt-1">Username is required.</div>
                  }
                </div>

                <!-- Email (read-only) -->
                <div class="mb-3">
                  <label for="emailInput" class="form-label fw-semibold">Email</label>
                  <input
                    id="emailInput"
                    type="text"
                    class="form-control"
                    [value]="user?.email || ''"
                    readonly />
                  <div class="form-text small">Your email address cannot be changed.</div>
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

                @if (serverError) {
                  <div class="alert alert-danger py-2 mb-3">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    {{ serverError }}
                  </div>
                }

                <!-- Actions -->
                <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                  <a routerLink="/users/me" class="btn btn-outline-secondary">
                    Cancel
                  </a>
                  <button
                    type="submit"
                    class="btn btn-primary d-inline-flex align-items-center"
                    [disabled]="saving || form.invalid || (!form.dirty && !selectedAvatarFile)">
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
export class EditProfileComponent implements OnInit, OnDestroy {
  private static readonly MAX_AVATAR_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  form: FormGroup;
  user: OwnUserProfileResponse | null = null;
  loading = true;
  saving = false;
  serverError = '';
  avatarError = '';
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: SafeUrl | null = null;
  private rawAvatarPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    public usersService: UsersService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      bio: ['']
    });
  }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.error('You must be logged in to edit your profile.');
      this.router.navigate(['/login']);
      return;
    }

    this.usersService.getOwnProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.form.patchValue({
          username: userData.username,
          bio: userData.bio || ''
        });
        this.form.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Could not load user profile.');
        this.router.navigate(['/users/me']);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseAvatarPreview();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError = '';
    this.releaseAvatarPreview();
    if (!EditProfileComponent.ALLOWED_AVATAR_TYPES.includes(file.type)) {
      input.value = '';
      this.avatarError = 'Please choose a JPEG, PNG, GIF or WebP image.';
      return;
    }
    if (file.size > EditProfileComponent.MAX_AVATAR_SIZE) {
      input.value = '';
      this.avatarError = 'Avatar image must be 5 MB or smaller.';
      return;
    }

    this.selectedAvatarFile = file;
    this.rawAvatarPreviewUrl = URL.createObjectURL(file);
    this.avatarPreviewUrl = this.sanitizer.bypassSecurityTrustUrl(this.rawAvatarPreviewUrl);
  }

  clearAvatarSelection(input?: HTMLInputElement): void {
    if (input) input.value = '';
    this.avatarError = '';
    this.releaseAvatarPreview();
  }

  private releaseAvatarPreview(): void {
    if (this.rawAvatarPreviewUrl) {
      URL.revokeObjectURL(this.rawAvatarPreviewUrl);
      this.rawAvatarPreviewUrl = null;
    }
    this.avatarPreviewUrl = null;
    this.selectedAvatarFile = null;
  }

  submit(): void {
    if (this.form.invalid || !this.user) return;
    if (this.form.pristine && !this.selectedAvatarFile) return;

    this.saving = true;
    this.serverError = '';

    const formVal = this.form.value;
    const req: UpdateUserRequest = {};

    if (formVal.username !== this.user.username) {
      req.username = formVal.username;
    }
    if (this.form.get('bio')?.dirty) {
      req.bio = formVal.bio;
    }

    const userId = this.user.id;
    const avatarFile = this.selectedAvatarFile;

    // Save text fields first, then upload the file so a rejected image never
    // leaves a half-updated profile.
    if (Object.keys(req).length > 0) {
      this.usersService.updateUser(userId, req).subscribe({
        next: () => this.uploadAvatarAfterSave(userId, avatarFile),
        error: (err: any) => this.handleSaveError(err)
      });
    } else {
      this.uploadAvatarAfterSave(userId, avatarFile);
    }
  }

  private uploadAvatarAfterSave(userId: number, avatarFile: File | null): void {
    if (!avatarFile) {
      this.finishSave();
      return;
    }
    this.usersService.uploadAvatar(userId, avatarFile).subscribe({
      next: (response) => {
        if (this.user) {
          this.user = { ...this.user, avatarUrl: response.avatarUrl };
        }
        this.finishSave();
      },
      error: (err: any) => this.handleSaveError(err)
    });
  }

  private finishSave(): void {
    this.clearAvatarSelection();
    this.form.markAsPristine();
    this.saving = false;
    this.notificationService.success('Profile updated successfully.');
    // Navbar listens to this and reloads the current user's avatar.
    this.usersService.notifyAvatarUpdated();
    this.router.navigate(['/users/me']);
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    const msg = err.error?.message || err.error?.error;
    if (msg) {
      this.serverError = msg;
    } else if (err.status === 409) {
      this.serverError = 'That username is already taken.';
    } else if (err.status === 413) {
      this.serverError = 'That image is too large. Maximum size is 5 MB.';
    } else if (err.status === 403) {
      this.serverError = 'You do not have permission to update this profile.';
    } else {
      this.serverError = 'Failed to update profile. Please try again.';
    }
  }
}

// Purpose: Edit profile modal.
// Opens from the user's own profile page, loads the current user, and saves
// username/bio/avatar in place without navigating away.
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService } from '../users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnUserProfileResponse, UpdateUserRequest } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent],
  template: `
    @if (isOpen) {
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Edit profile"
        style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
        (click)="onBackdropClick($event)">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div class="modal-content shadow border-0 profile-modal">
            <div class="modal-header border-0 pb-0 px-4 pt-4">
              <h5 class="modal-title fw-bold d-flex align-items-center">
                <span class="profile-modal-icon me-2"><i class="bi bi-person-gear"></i></span>
                Edit Profile
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="saving"
                (click)="close()"></button>
            </div>

            @if (loading) {
              <div class="modal-body px-4 py-4">
                <app-loading message="Loading profile..."></app-loading>
              </div>
            } @else {
              <form [formGroup]="form" (ngSubmit)="submit()">
                <div class="modal-body px-4 py-3">
                  <!-- Clickable avatar with live preview -->
                  <div class="profile-avatar-section mb-4">
                    <button
                      type="button"
                      class="avatar-upload"
                      title="Change profile photo"
                      aria-label="Change profile photo"
                      (click)="avatarInput.click()">
                      @if (avatarPreviewUrl) {
                        <img [src]="avatarPreviewUrl" alt="Avatar preview" class="avatar-upload-img" />
                      } @else if (user?.avatarUrl) {
                        <img
                          [src]="usersService.getAvatarUrl(user?.avatarUrl)"
                          alt="Avatar"
                          class="avatar-upload-img" />
                      } @else {
                        <span class="avatar-upload-placeholder"><i class="bi bi-person-fill"></i></span>
                      }
                      <span class="avatar-upload-overlay"><i class="bi bi-camera-fill"></i></span>
                      <span class="avatar-edit-badge"><i class="bi bi-pencil-fill"></i></span>
                    </button>

                    <input
                      #avatarInput
                      type="file"
                      class="d-none"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      (change)="onAvatarSelected($event)" />

                    <div class="text-center text-md-start">
                      <h6 class="fw-bold mb-1">{{ user?.username }}</h6>
                      <span class="text-muted small">
                        Member since {{ user?.createdAt | date:'mediumDate' }}
                      </span>
                      <div class="profile-hint mt-2">
                        Click the photo to upload a new one · JPEG, PNG, GIF or WebP, up to 5 MB.
                      </div>
                      @if (selectedAvatarFile) {
                        <button
                          type="button"
                          class="avatar-remove mt-2"
                          (click)="clearAvatarSelection(avatarInput)">
                          <i class="bi bi-x-circle me-1"></i>Remove new photo
                        </button>
                      }
                      @if (avatarError) {
                        <div class="text-danger small mt-1">{{ avatarError }}</div>
                      }
                    </div>
                  </div>

                  <div class="mb-3">
                    <label for="modalUsernameInput" class="form-label fw-semibold">Username</label>
                    <input
                      id="modalUsernameInput"
                      type="text"
                      class="form-control"
                      formControlName="username" />
                    @if (form.get('username')?.touched && form.get('username')?.hasError('required')) {
                      <div class="text-danger small mt-1">Username is required.</div>
                    }
                  </div>

                  <div class="mb-3">
                    <label for="modalEmailInput" class="form-label fw-semibold">Email</label>
                    <input
                      id="modalEmailInput"
                      type="text"
                      class="form-control"
                      [value]="user?.email || ''"
                      readonly />
                    <div class="form-text small">Your email address cannot be changed.</div>
                  </div>

                  <div class="mb-1">
                    <label for="modalBioInput" class="form-label fw-semibold">Bio</label>
                    <textarea
                      id="modalBioInput"
                      rows="4"
                      class="form-control"
                      formControlName="bio"
                      placeholder="Tell the community about yourself..."></textarea>
                  </div>

                  @if (serverError) {
                    <div class="alert alert-danger py-2 mb-0 mt-3">
                      <i class="bi bi-exclamation-circle-fill me-2"></i>{{ serverError }}
                    </div>
                  }
                </div>

                <div class="modal-footer border-0 pt-0 px-4 pb-4">
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    [disabled]="saving"
                    (click)="close()">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary px-4"
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
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class EditProfileModalComponent implements OnDestroy {
  private static readonly MAX_AVATAR_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  @Output() saved = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  saving = false;
  serverError = '';
  avatarError = '';
  user: OwnUserProfileResponse | null = null;
  form: FormGroup;
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: SafeUrl | null = null;
  private rawAvatarPreviewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    public usersService: UsersService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      bio: ['']
    });
  }

  show(): void {
    if (this.isOpen) return;
    if (!this.authService.isLoggedIn()) {
      this.notificationService.error('You must be logged in to edit your profile.');
      return;
    }

    this.isOpen = true;
    this.loading = true;
    this.serverError = '';
    this.avatarError = '';
    this.clearAvatarSelection();

    this.usersService.getOwnProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.form.patchValue({ username: userData.username, bio: userData.bio || '' });
        this.form.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.serverError = 'Could not load your profile.';
      }
    });
  }

  close(): void {
    if (this.saving) return;
    this.isOpen = false;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError = '';
    this.releaseAvatarPreview();
    if (!EditProfileModalComponent.ALLOWED_AVATAR_TYPES.includes(file.type)) {
      input.value = '';
      this.avatarError = 'Please choose a JPEG, PNG, GIF or WebP image.';
      return;
    }
    if (file.size > EditProfileModalComponent.MAX_AVATAR_SIZE) {
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
    if (this.form.invalid || !this.user || this.saving) return;
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

    this.usersService.updateUser(this.user.id, req, this.selectedAvatarFile).subscribe({
      next: (response) => {
        this.user = { ...this.user!, avatarUrl: response.avatarUrl };
        this.saving = false;
        this.clearAvatarSelection();
        this.form.markAsPristine();
        this.notificationService.success('Profile updated successfully.');
        this.usersService.notifyAvatarUpdated();
        this.saved.emit();
        this.close();
      },
      error: (err: any) => {
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
    });
  }

  ngOnDestroy(): void {
    this.releaseAvatarPreview();
  }
}

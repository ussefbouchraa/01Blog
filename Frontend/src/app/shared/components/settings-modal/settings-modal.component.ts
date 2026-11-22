// Purpose: Settings modal component with two tabs: Edit Profile and Edit Credentials.
// Profile tab uses PUT /api/users/{id}. Credentials tab is disabled (backend endpoint pending).
// Follows the same modal pattern as ConfirmModalComponent (standalone, no NgbModal).
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsersService } from '../../../features/users/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OwnUserProfileResponse } from '../../../core/models';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen) {
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
        (click)="onBackdropClick($event)">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div class="modal-content shadow border-0" style="border-radius: 12px;">
            <!-- Header -->
            <div class="modal-header border-0 pb-0 px-4 pt-4">
              <h5 class="modal-title fw-bold d-flex align-items-center">
                <i class="bi bi-gear-fill me-2 text-primary"></i>Settings
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="saving"
                (click)="close()"></button>
            </div>

            <div class="modal-body px-4 pb-4 pt-3">
              <!-- Tabs -->
              <ul class="nav nav-tabs mb-4" role="tablist">
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link d-flex align-items-center"
                    [class.active]="activeTab === 'profile'"
                    (click)="activeTab = 'profile'"
                    type="button"
                    role="tab">
                    <i class="bi bi-person me-2"></i>Edit Profile
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button
                    class="nav-link d-flex align-items-center"
                    [class.active]="activeTab === 'credentials'"
                    (click)="activeTab = 'credentials'"
                    type="button"
                    role="tab">
                    <i class="bi bi-shield-lock me-2"></i>Edit Credentials
                  </button>
                </li>
              </ul>

              <!-- Loading -->
              @if (loading) {
                <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <p class="text-muted mt-2 mb-0">Loading your profile...</p>
                </div>
              }

              <!-- PROFILE TAB -->
              @if (!loading && activeTab === 'profile') {
                <form [formGroup]="profileForm" (ngSubmit)="submitProfile()">
                  <!-- Avatar upload with live preview -->
                  <div class="d-flex align-items-center gap-3 mb-4">
                    @if (avatarPreviewUrl) {
                      <img
                        [src]="avatarPreviewUrl"
                        alt="Avatar preview"
                        class="rounded-circle shadow-sm object-fit-cover"
                        width="64"
                        height="64" />
                    } @else if (profile?.avatarUrl) {
                      <img
                        [src]="usersService.getAvatarUrl(profile?.avatarUrl)"
                        alt="Avatar"
                        class="rounded-circle shadow-sm object-fit-cover"
                        width="64"
                        height="64" />
                    } @else {
                      <div
                        class="bg-light rounded-circle d-flex align-items-center justify-content-center text-secondary shadow-sm"
                        style="width: 64px; height: 64px;">
                        <i class="bi bi-person-fill fs-3"></i>
                      </div>
                    }
                    <div class="flex-grow-1">
                      <h6 class="fw-bold mb-0">{{ profile?.username }}</h6>
                      <span class="text-muted small">Member since {{ profile?.createdAt | date:'mediumDate' }}</span>
                      <div class="d-flex align-items-center gap-2 mt-2">
                        <input
                          #avatarInput
                          id="settingsAvatarFile"
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
                    <label for="settingsUsername" class="form-label fw-semibold">Username</label>
                    <input
                      id="settingsUsername"
                      type="text"
                      class="form-control"
                      formControlName="username"
                      placeholder="Your username" />
                    @if (profileForm.get('username')?.touched && profileForm.get('username')?.hasError('required')) {
                      <div class="text-danger small mt-1">Username is required.</div>
                    }
                  </div>

                  <!-- Email (read-only) -->
                  <div class="mb-3">
                    <label for="settingsEmail" class="form-label fw-semibold">Email</label>
                    <input
                      id="settingsEmail"
                      type="text"
                      class="form-control"
                      [value]="profile?.email || ''"
                      readonly />
                    <div class="form-text small">Your email address cannot be changed.</div>
                  </div>

                  <!-- Bio -->
                  <div class="mb-3">
                    <label for="settingsBio" class="form-label fw-semibold">Bio</label>
                    <textarea
                      id="settingsBio"
                      rows="3"
                      class="form-control"
                      formControlName="bio"
                      placeholder="Tell the community about yourself..."></textarea>
                  </div>

                  <!-- Server error -->
                  @if (profileError) {
                    <div class="alert alert-danger d-flex align-items-center py-2 mb-3" role="alert">
                      <i class="bi bi-exclamation-circle-fill me-2"></i>
                      <span>{{ profileError }}</span>
                    </div>
                  }

                  <!-- Actions -->
                  <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                    <button type="button" class="btn btn-outline-secondary" (click)="close()" [disabled]="saving">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary d-inline-flex align-items-center"
                      [disabled]="saving || profileForm.invalid || (!profileForm.dirty && !selectedAvatarFile)">
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

              <!-- CREDENTIALS TAB -->
              @if (!loading && activeTab === 'credentials') {
                <div class="alert alert-warning d-flex align-items-start mb-4" role="alert">
                  <i class="bi bi-exclamation-triangle-fill fs-5 me-2 flex-shrink-0 mt-1"></i>
                  <div class="small">
                    <strong>Not Available Yet:</strong> Password change functionality requires a backend endpoint
                    (<code>PUT /api/auth/change-password</code>) that has not been implemented.
                    This feature will be enabled in a future update.
                  </div>
                </div>

                <form [formGroup]="credentialsForm">
                  <!-- Current Password -->
                  <div class="mb-3">
                    <label for="currentPassword" class="form-label fw-semibold">Current Password</label>
                    <input
                      id="currentPassword"
                      type="password"
                      class="form-control"
                      formControlName="currentPassword"
                      placeholder="Enter current password"
                      [disabled]="true" />
                  </div>

                  <!-- New Password -->
                  <div class="mb-3">
                    <label for="newPassword" class="form-label fw-semibold">New Password</label>
                    <input
                      id="newPassword"
                      type="password"
                      class="form-control"
                      formControlName="newPassword"
                      placeholder="Enter new password"
                      [disabled]="true" />
                  </div>

                  <!-- Confirm New Password -->
                  <div class="mb-3">
                    <label for="confirmNewPassword" class="form-label fw-semibold">Confirm New Password</label>
                    <input
                      id="confirmNewPassword"
                      type="password"
                      class="form-control"
                      formControlName="confirmNewPassword"
                      placeholder="Confirm new password"
                      [disabled]="true" />
                  </div>

                  <!-- Disabled button -->
                  <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                    <button type="button" class="btn btn-outline-secondary" (click)="close()">
                      Cancel
                    </button>
                    <button
                      type="button"
                      class="btn btn-primary d-inline-flex align-items-center"
                      disabled>
                      <i class="bi bi-lock me-1"></i>Change Password
                    </button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class SettingsModalComponent implements OnInit, OnDestroy {
  private static readonly MAX_AVATAR_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  @Output() closed = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  saving = false;
  activeTab: 'profile' | 'credentials' = 'profile';
  profile: OwnUserProfileResponse | null = null;
  profileError = '';
  avatarError = '';
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: SafeUrl | null = null;
  private rawAvatarPreviewUrl: string | null = null;

  profileForm: FormGroup;
  credentialsForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public usersService: UsersService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required]],
      bio: ['']
    });

    this.credentialsForm = this.fb.group({
      currentPassword: [{ value: '', disabled: true }],
      newPassword: [{ value: '', disabled: true }],
      confirmNewPassword: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.releaseAvatarPreview();
  }

  open(): void {
    this.isOpen = true;
    this.activeTab = 'profile';
    this.profileError = '';
    this.clearAvatarSelection();
    this.loadProfile();
  }

  close(): void {
    if (this.saving) return;
    this.isOpen = false;
    this.avatarError = '';
    this.releaseAvatarPreview();
    this.closed.emit();
  }

  private loadProfile(): void {
    this.loading = true;
    this.usersService.getOwnProfile().subscribe({
      next: (data: OwnUserProfileResponse) => {
        this.profile = data;
        this.profileForm.patchValue({
          username: data.username || '',
          bio: data.bio || ''
        });
        this.profileForm.markAsPristine();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Could not load your profile.');
        this.close();
      }
    });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarError = '';
    this.releaseAvatarPreview();
    if (!SettingsModalComponent.ALLOWED_AVATAR_TYPES.includes(file.type)) {
      input.value = '';
      this.avatarError = 'Please choose a JPEG, PNG, GIF or WebP image.';
      return;
    }
    if (file.size > SettingsModalComponent.MAX_AVATAR_SIZE) {
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

  submitProfile(): void {
    if (this.profileForm.invalid || !this.profile) return;
    if (this.profileForm.pristine && !this.selectedAvatarFile) return;

    this.saving = true;
    this.profileError = '';

    // Build request with only changed fields (non-null = update, absent = skip)
    const formVal = this.profileForm.value;
    const req: { username?: string; bio?: string } = {};

    if (formVal.username !== this.profile.username) {
      req.username = formVal.username;
    }
    // Bio may be cleared intentionally, so send it whenever the field was edited.
    if (this.profileForm.get('bio')?.dirty) {
      req.bio = formVal.bio;
    }

    this.usersService.updateUser(this.profile.id, req, this.selectedAvatarFile).subscribe({
      next: (response) => this.finishProfileSave(response.avatarUrl),
      error: (err: any) => this.handleSaveError(err)
    });
  }

  private finishProfileSave(avatarUrl?: string | null): void {
    if (avatarUrl !== undefined && this.profile) {
      this.profile = { ...this.profile, avatarUrl: avatarUrl };
    }
    this.clearAvatarSelection();
    this.profileForm.markAsPristine();
    this.saving = false;
    this.notificationService.success('Profile updated successfully.');
    // Navbar listens for this event and reloads the current user's avatar.
    this.profileUpdated.emit();
    this.close();
  }

  private handleSaveError(err: any): void {
    this.saving = false;
    const serverMsg = err.error?.message || err.error?.error;
    if (serverMsg) {
      this.profileError = serverMsg;
    } else if (err.status === 409) {
      this.profileError = 'That username is already taken.';
    } else if (err.status === 413) {
      this.profileError = 'That image is too large. Maximum size is 5 MB.';
    } else if (err.status === 403) {
      this.profileError = 'You do not have permission to update this profile.';
    } else {
      this.profileError = 'Failed to update profile. Please try again.';
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }
}

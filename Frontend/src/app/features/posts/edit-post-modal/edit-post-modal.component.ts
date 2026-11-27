// Purpose: Edit post modal.
// Opens from the feed, post detail, or profile page and updates a post in place.
import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostsService } from '../posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PostResponse } from '../../../core/models';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Component({
  selector: 'app-edit-post-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen && post) {
      <div
        class="modal fade show d-block"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Edit post"
        style="background-color: rgba(0, 0, 0, 0.5); z-index: 1055;"
        (click)="onBackdropClick($event)">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
          <div class="modal-content shadow border-0 profile-modal">
            <div class="modal-header border-0 pb-0 px-4 pt-4">
              <h5 class="modal-title fw-bold d-flex align-items-center">
                <span class="profile-modal-icon me-2"><i class="bi bi-pencil"></i></span>
                Edit Post
              </h5>
              <button
                type="button"
                class="btn-close"
                aria-label="Close"
                [disabled]="submitting"
                (click)="close()"></button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="modal-body px-4 py-3">
                @if (errorMessage) {
                  <div class="alert alert-danger py-2 mb-3 d-flex align-items-center" role="alert">
                    <i class="bi bi-exclamation-circle-fill me-2"></i>
                    <span>{{ errorMessage }}</span>
                  </div>
                }

                <div class="mb-3">
                  <label for="editModalContent" class="form-label fw-semibold">
                    Post Content <span class="text-danger">*</span>
                  </label>
                  <textarea
                    id="editModalContent"
                    rows="6"
                    class="form-control"
                    formControlName="content"
                    placeholder="Write your post content..."
                    [class.is-invalid]="form.get('content')?.invalid && form.get('content')?.touched"></textarea>
                  @if (form.get('content')?.touched && form.get('content')?.hasError('required')) {
                    <div class="invalid-feedback">Post content cannot be empty.</div>
                  }
                </div>

                @if (post.mediaUrl && !newPreviewUrl) {
                  <div class="mb-3">
                    <label class="form-label fw-semibold d-block">Current Attachment</label>
                    <div class="card bg-light border p-2 text-center position-relative">
                      @if (isImageMedia(post.mediaType)) {
                        <img
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          alt="Current media"
                          class="img-fluid rounded"
                          style="max-height: 220px; object-fit: contain;" />
                      } @else if (isVideoMedia(post.mediaType)) {
                        <video
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          controls
                          class="w-100 rounded"
                          style="max-height: 220px;"></video>
                      }
                      <span class="badge bg-secondary position-absolute top-0 start-0 m-2">Current Media</span>
                    </div>
                  </div>
                }

                <div class="mb-3">
                  <label for="editModalFile" class="form-label fw-semibold">
                    {{ post.mediaUrl ? 'Replace Attachment' : 'Add Attachment' }}
                    <span class="text-muted fw-normal small">(Optional)</span>
                  </label>
                  <input
                    #replacementInput
                    id="editModalFile"
                    type="file"
                    class="form-control"
                    (change)="onFileSelected($event)"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                    [disabled]="submitting" />
                  <div class="form-text small">
                    Supported: JPEG, PNG, GIF, WebP, MP4, WebM (Max 50MB).
                  </div>
                  @if (fileError) {
                    <div class="text-danger small mt-1">
                      <i class="bi bi-x-circle me-1"></i>{{ fileError }}
                    </div>
                  }
                </div>

                @if (newPreviewUrl) {
                  <div class="card bg-light border mb-1 position-relative">
                    <div class="card-body p-2 text-center position-relative">
                      <span class="badge bg-success position-absolute top-0 start-0 m-2">New Attachment Preview</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                        style="width: 32px; height: 32px; padding: 0;"
                        (click)="removeNewFile(replacementInput)"
                        title="Remove replacement">
                        <i class="bi bi-x"></i>
                      </button>

                      @if (newPreviewType === 'image') {
                        <img
                          [src]="newPreviewUrl"
                          alt="Replacement preview"
                          class="img-fluid rounded"
                          style="max-height: 240px; object-fit: contain;" />
                      } @else if (newPreviewType === 'video') {
                        <video
                          [src]="newPreviewUrl"
                          controls
                          class="w-100 rounded"
                          style="max-height: 240px;"></video>
                      }
                      <div class="small text-muted mt-2">
                        <i class="bi bi-paperclip me-1"></i>{{ newFile?.name }}
                      </div>
                    </div>
                  </div>
                }
              </div>

              <div class="modal-footer border-0 pt-0 px-4 pb-4">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  [disabled]="submitting"
                  (click)="close()">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary px-4 d-inline-flex align-items-center"
                  [disabled]="form.invalid || submitting || !!fileError">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving Changes...
                  } @else {
                    <i class="bi bi-check2-circle me-2"></i>Save Changes
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class EditPostModalComponent implements OnDestroy {
  @Output() updated = new EventEmitter<PostResponse>();

  isOpen = false;
  post: PostResponse | null = null;
  form: FormGroup;
  submitting = false;
  errorMessage = '';
  newFile: File | null = null;
  newPreviewUrl: string | null = null;
  newPreviewType: 'image' | 'video' | null = null;
  fileError = '';

  constructor(
    private fb: FormBuilder,
    public postsService: PostsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required]]
    });
  }

  show(post: PostResponse): void {
    if (this.isOpen) return;

    const currentUserId = this.authService.getUserId();
    const isAuthor = currentUserId !== null && currentUserId === post.author.id;
    const isAdmin = this.authService.getRole() === 'ROLE_ADMIN';
    if (!isAuthor && !isAdmin) {
      this.notificationService.error('You do not have permission to edit this post.');
      return;
    }

    this.post = post;
    this.form.patchValue({ content: post.content });
    this.form.markAsPristine();
    this.errorMessage = '';
    this.clearNewFile();
    this.submitting = false;
    this.isOpen = true;
  }

  close(): void {
    if (this.submitting) return;
    this.isOpen = false;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.close();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileError = '';

    if (!input.files || input.files.length === 0) {
      this.clearNewFile();
      return;
    }

    const file = input.files[0];
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      this.fileError = 'Only JPEG, PNG, GIF, WebP, MP4, and WebM files are allowed.';
      this.clearNewFile(input);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.fileError = 'File size exceeds maximum limit of 50MB.';
      this.clearNewFile(input);
      return;
    }

    this.revokeNewPreviewUrl();
    this.newFile = file;
    this.newPreviewType = isImage ? 'image' : 'video';
    this.newPreviewUrl = URL.createObjectURL(file);
  }

  removeNewFile(input?: HTMLInputElement): void {
    this.clearNewFile(input);
  }

  private clearNewFile(inputElement?: HTMLInputElement | null): void {
    this.newFile = null;
    this.newPreviewType = null;
    this.fileError = '';
    this.revokeNewPreviewUrl();
    if (inputElement) {
      inputElement.value = '';
    }
  }

  private revokeNewPreviewUrl(): void {
    if (this.newPreviewUrl) {
      URL.revokeObjectURL(this.newPreviewUrl);
      this.newPreviewUrl = null;
    }
  }

  submit(): void {
    if (this.form.invalid || this.submitting || this.fileError || !this.post) return;

    const rawContent = this.form.value.content;
    const trimmedContent = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!trimmedContent) {
      this.errorMessage = 'Post content cannot be empty.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('content', trimmedContent);
    if (this.newFile) {
      formData.append('file', this.newFile);
    }

    this.postsService.updatePost(this.post.id, formData).subscribe({
      next: (updated) => {
        this.submitting = false;
        this.notificationService.success('Post updated successfully!');
        this.updated.emit(updated);
        this.close();
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Failed to update post.';
      }
    });
  }

  isImageMedia(type: string | null | undefined): boolean {
    if (!type) return false;
    const lower = type.toLowerCase();
    return lower === 'image' || lower.startsWith('image/');
  }

  isVideoMedia(type: string | null | undefined): boolean {
    if (!type) return false;
    const lower = type.toLowerCase();
    return lower === 'video' || lower.startsWith('video/');
  }

  ngOnDestroy(): void {
    this.revokeNewPreviewUrl();
  }
}

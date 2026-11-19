// Purpose: Edit post page component.
// Pre-fills existing post data, verifies author ownership, and updates text and/or media attachment.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PostResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-9 col-lg-8">
        <!-- Back Link -->
        <div class="mb-3">
          <a [routerLink]="['/posts', postId]" class="btn btn-sm btn-link text-decoration-none text-muted p-0">
            <i class="bi bi-arrow-left me-1"></i>Back to Post
          </a>
        </div>

        <!-- Loading State -->
        @if (initialLoading) {
          <app-loading message="Loading post for editing..."></app-loading>
        }

        <!-- Permission or Not Found Error -->
        @if (permissionError && !initialLoading) {
          <div class="alert alert-danger shadow-sm py-3" role="alert">
            <div class="d-flex align-items-center mb-2">
              <i class="bi bi-shield-x fs-4 me-2"></i>
              <h5 class="alert-heading mb-0">Access Denied</h5>
            </div>
            <p class="mb-3">{{ permissionError }}</p>
            <a [routerLink]="['/posts', postId]" class="btn btn-sm btn-outline-danger">Return to Post</a>
          </div>
        }

        <!-- Edit Form Card -->
        @if (post && !initialLoading && !permissionError) {
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">
              <!-- Header -->
              <div class="d-flex align-items-center mb-4">
                <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                  <i class="bi bi-pencil fs-5"></i>
                </div>
                <div>
                  <h3 class="card-title fw-bold mb-0">Edit Post</h3>
                  <p class="text-muted small mb-0">Update your content or replace your attachment.</p>
                </div>
              </div>

              <!-- Submit Error Banner -->
              @if (errorMessage) {
                <div class="alert alert-danger py-2 mb-3 d-flex align-items-center" role="alert">
                  <i class="bi bi-exclamation-circle-fill me-2"></i>
                  <div>{{ errorMessage }}</div>
                </div>
              }

              <form [formGroup]="form" (ngSubmit)="submit()">
                <!-- Content Textarea -->
                <div class="mb-3">
                  <label for="postContent" class="form-label fw-semibold">
                    Post Content <span class="text-danger">*</span>
                  </label>
                  <textarea
                    id="postContent"
                    rows="6"
                    class="form-control"
                    formControlName="content"
                    placeholder="Write your post content..."
                    [class.is-invalid]="form.get('content')?.invalid && form.get('content')?.touched"></textarea>
                  @if (form.get('content')?.touched && form.get('content')?.hasError('required')) {
                    <div class="invalid-feedback">Post content cannot be empty.</div>
                  }
                </div>

                <!-- Existing Media Display -->
                @if (post.mediaUrl && !newPreviewUrl) {
                  <div class="mb-3">
                    <label class="form-label fw-semibold d-block">Current Attachment</label>
                    <div class="card bg-light border p-2 text-center position-relative">
                      @if (isImageMedia(post.mediaType)) {
                        <img
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          alt="Current media"
                          class="img-fluid rounded"
                          style="max-height: 250px; object-fit: contain;" />
                      } @else if (isVideoMedia(post.mediaType)) {
                        <video
                          [src]="postsService.getMediaUrl(post.mediaUrl)"
                          controls
                          class="w-100 rounded"
                          style="max-height: 250px;">
                        </video>
                      }
                      <span class="badge bg-secondary position-absolute top-0 start-0 m-2">Current Media</span>
                    </div>
                  </div>
                }

                <!-- New Media Attachment -->
                <div class="mb-3">
                  <label for="replacementFile" class="form-label fw-semibold">
                    {{ post.mediaUrl ? 'Replace Attachment' : 'Add Attachment' }}
                    <span class="text-muted fw-normal small">(Optional)</span>
                  </label>
                  <input
                    id="replacementFile"
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

                <!-- New Media Preview -->
                @if (newPreviewUrl) {
                  <div class="card bg-light border mb-4 position-relative">
                    <div class="card-body p-2 text-center position-relative">
                      <span class="badge bg-success position-absolute top-0 start-0 m-2">New Attachment Preview</span>
                      <button
                        type="button"
                        class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                        style="width: 32px; height: 32px; padding: 0;"
                        (click)="removeNewFile()"
                        title="Remove replacement">
                        <i class="bi bi-x"></i>
                      </button>

                      @if (newPreviewType === 'image') {
                        <img
                          [src]="newPreviewUrl"
                          alt="Replacement preview"
                          class="img-fluid rounded"
                          style="max-height: 280px; object-fit: contain;" />
                      } @else if (newPreviewType === 'video') {
                        <video
                          [src]="newPreviewUrl"
                          controls
                          class="w-100 rounded"
                          style="max-height: 280px;">
                        </video>
                      }
                      <div class="small text-muted mt-2">
                        <i class="bi bi-paperclip me-1"></i>{{ newFile?.name }}
                      </div>
                    </div>
                  </div>
                }

                <!-- Actions -->
                <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                  <a [routerLink]="['/posts', postId]" class="btn btn-outline-secondary" [class.disabled]="submitting">
                    Cancel
                  </a>
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
        }
      </div>
    </div>
  `,
  styles: []
})
export class EditPostComponent implements OnInit, OnDestroy {
  postId: number | null = null;
  post: PostResponse | null = null;

  form: FormGroup;
  initialLoading = true;
  submitting = false;
  permissionError = '';
  errorMessage = '';

  newFile: File | null = null;
  newPreviewUrl: string | null = null;
  newPreviewType: 'image' | 'video' | null = null;
  fileError = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    public postsService: PostsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.postId = idParam ? Number(idParam) : null;

    if (!this.postId || isNaN(this.postId)) {
      this.permissionError = 'Invalid post ID.';
      this.initialLoading = false;
      return;
    }

    this.loadPost(this.postId);
  }

  loadPost(id: number): void {
    this.initialLoading = true;
    this.postsService.getPostById(id).subscribe({
      next: (postData) => {
        this.post = postData;
        this.initialLoading = false;

        // Verify permission: only the author or an admin can edit
        const currentUserId = this.authService.getUserId();
        const currentUserRole = this.authService.getRole();
        const isAuthor = currentUserId !== null && currentUserId === postData.author.id;
        const isAdmin = currentUserRole === 'ROLE_ADMIN';

        if (!isAuthor && !isAdmin) {
          this.permissionError = 'You do not have permission to edit this post.';
          return;
        }

        // Pre-fill form
        this.form.patchValue({
          content: postData.content
        });
      },
      error: (err) => {
        this.initialLoading = false;
        this.permissionError =
          err.status === 404
            ? 'Post not found.'
            : err.error?.message || 'Failed to load post.';
      }
    });
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

  removeNewFile(): void {
    const input = document.getElementById('replacementFile') as HTMLInputElement | null;
    this.clearNewFile(input);
  }

  private clearNewFile(inputElement?: HTMLInputElement | null): void {
    this.newFile = null;
    this.newPreviewType = null;
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
    if (this.form.invalid || this.submitting || this.fileError || !this.postId) {
      return;
    }

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

    this.postsService.updatePost(this.postId, formData).subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.success('Post updated successfully!');
        this.router.navigate(['/posts', this.postId]);
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

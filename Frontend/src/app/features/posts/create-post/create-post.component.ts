// Purpose: Create post page component.
// Allows authenticated users to write a post with text and optional image/video attachment.
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { NotificationService } from '../../../core/services/notification.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-9 col-lg-8">
        <div class="card shadow-sm border-0">
          <div class="card-body p-4">
            <!-- Header -->
            <div class="d-flex align-items-center mb-4">
              <div class="bg-primary bg-opacity-10 text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                <i class="bi bi-pencil-square fs-5"></i>
              </div>
              <div>
                <h3 class="card-title fw-bold mb-0">Create New Post</h3>
                <p class="text-muted small mb-0">Share your thoughts, discoveries or learning progress.</p>
              </div>
            </div>

            <!-- Error Banner -->
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
                  What's on your mind? <span class="text-danger">*</span>
                </label>
                <textarea
                  id="postContent"
                  rows="5"
                  class="form-control"
                  formControlName="content"
                  placeholder="Write your post content here... (Markdown supported soon)"
                  [class.is-invalid]="form.get('content')?.invalid && form.get('content')?.touched"></textarea>
                @if (form.get('content')?.touched && form.get('content')?.hasError('required')) {
                  <div class="invalid-feedback">Post content cannot be empty.</div>
                }
              </div>

              <!-- Media Attachment Input -->
              <div class="mb-3">
                <label for="mediaFile" class="form-label fw-semibold">
                  Attach Media <span class="text-muted fw-normal small">(Optional — Images or Videos)</span>
                </label>
                <input
                  id="mediaFile"
                  type="file"
                  class="form-control"
                  (change)="onFileSelected($event)"
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
                  [disabled]="loading" />
                <div class="form-text small">
                  Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM (Max: 50MB).
                </div>
                @if (fileError) {
                  <div class="text-danger small mt-1">
                    <i class="bi bi-x-circle me-1"></i>{{ fileError }}
                  </div>
                }
              </div>

              <!-- Media Preview Box -->
              @if (previewUrl) {
                <div class="card bg-light border mb-4 position-relative overflow-hidden">
                  <div class="card-body p-2 text-center position-relative">
                    <button
                      type="button"
                      class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                      style="width: 32px; height: 32px; padding: 0;"
                      (click)="removeFile()"
                      title="Remove media">
                      <i class="bi bi-x"></i>
                    </button>

                    @if (previewType === 'image') {
                      <img
                        [src]="previewUrl"
                        alt="Selected attachment preview"
                        class="img-fluid rounded shadow-sm"
                        style="max-height: 350px; object-fit: contain;" />
                    } @else if (previewType === 'video') {
                      <video
                        [src]="previewUrl"
                        controls
                        class="w-100 rounded shadow-sm"
                        style="max-height: 350px;">
                        Your browser does not support the video tag.
                      </video>
                    }
                    <div class="small text-muted mt-2">
                      <i class="bi bi-paperclip me-1"></i>{{ selectedFile?.name }}
                    </div>
                  </div>
                </div>
              }

              <!-- Actions -->
              <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                <a routerLink="/home" class="btn btn-outline-secondary" [class.disabled]="loading">
                  Cancel
                </a>
                <button
                  type="submit"
                  class="btn btn-primary px-4 d-inline-flex align-items-center"
                  [disabled]="form.invalid || loading || !!fileError">
                  @if (loading) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Publishing...
                  } @else {
                    <i class="bi bi-send-fill me-2"></i>Publish Post
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class CreatePostComponent implements OnDestroy {
  form: FormGroup;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  previewType: 'image' | 'video' | null = null;
  fileError = '';
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private postsService: PostsService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      content: ['', [Validators.required]]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fileError = '';

    if (!input.files || input.files.length === 0) {
      this.clearFile();
      return;
    }

    const file = input.files[0];

    // Validate file type matching backend PostFileService
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      this.fileError = 'Only JPEG, PNG, GIF, WebP, MP4, and WebM files are allowed.';
      this.clearFile(input);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.fileError = 'File size exceeds maximum limit of 50MB.';
      this.clearFile(input);
      return;
    }

    // Clean up any existing object URL preview
    this.revokePreviewUrl();

    this.selectedFile = file;
    this.previewType = isImage ? 'image' : 'video';
    this.previewUrl = URL.createObjectURL(file);
  }

  removeFile(): void {
    const fileInput = document.getElementById('mediaFile') as HTMLInputElement | null;
    this.clearFile(fileInput);
  }

  private clearFile(inputElement?: HTMLInputElement | null): void {
    this.selectedFile = null;
    this.previewType = null;
    this.revokePreviewUrl();
    if (inputElement) {
      inputElement.value = '';
    }
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading || this.fileError) {
      return;
    }

    const rawContent = this.form.value.content;
    const trimmedContent = typeof rawContent === 'string' ? rawContent.trim() : '';

    if (!trimmedContent) {
      this.errorMessage = 'Post content cannot be empty.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('content', trimmedContent);
    if (this.selectedFile) {
      formData.append('file', this.selectedFile);
    }

    this.postsService.createPost(formData).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.success('Post published successfully!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Failed to publish post. Please try again.';
      }
    });
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }
}

// Purpose: Admin — manage posts tab.
// Lists every post with its moderation status, lets an admin hide/unhide a post
// and delete one after confirmation.
// GET /api/admin/posts · PATCH /api/admin/posts/{id}/hide · DELETE /api/admin/posts/{id}
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PostResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-posts-tab',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="card shadow-sm border-0">
      <div class="card-header bg-white border-0 pt-3 px-4 d-flex align-items-center justify-content-between">
        <h5 class="fw-bold mb-0">
          <i class="bi bi-file-earmark-text me-2 text-primary"></i>All Posts
          <span class="badge bg-secondary ms-1">{{ posts.length }}</span>
        </h5>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
          [disabled]="loading"
          (click)="loadPosts()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      <div class="card-body px-4 pb-4 pt-3">
        @if (loading) {
          <app-loading message="Loading posts..."></app-loading>
        }

        @if (error && !loading) {
          <div class="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="loadPosts()">Retry</button>
          </div>
        }

        @if (!loading && !error && posts.length === 0) {
          <p class="text-muted text-center py-4 mb-0">No posts found.</p>
        }

        @if (!loading && !error && posts.length > 0) {
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="text-muted small text-uppercase">
                  <th scope="col">ID</th>
                  <th scope="col">Author</th>
                  <th scope="col">Content</th>
                  <th scope="col">Status</th>
                  <th scope="col">Date</th>
                  <th scope="col" class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (post of posts; track post.id) {
                  <tr>
                    <td class="text-muted">{{ post.id }}</td>
                    <td>
                      <a [routerLink]="['/users', post.author.id]" class="fw-semibold text-decoration-none">
                        {{ post.author.username }}
                      </a>
                    </td>
                    <td class="small text-break" style="max-width: 320px;">
                      <a [routerLink]="['/posts', post.id]" class="text-decoration-none text-dark">
                        {{ truncate(post.content, 90) }}
                      </a>
                    </td>
                    <td>
                      @if (post.hidden) {
                        <span class="badge bg-warning text-dark">Hidden</span>
                      } @else {
                        <span class="badge bg-success">Visible</span>
                      }
                    </td>
                    <td class="text-muted small text-nowrap">{{ post.createdAt | date:'mediumDate' }}</td>
                    <td class="text-end text-nowrap">
                      <button
                        type="button"
                        class="btn btn-sm me-2"
                        [ngClass]="post.hidden ? 'btn-outline-success' : 'btn-outline-warning'"
                        [disabled]="isBusy(post.id)"
                        [title]="post.hidden ? 'Unhide post' : 'Hide post'"
                        (click)="toggleHidden(post)">
                        <i class="bi" [ngClass]="post.hidden ? 'bi-eye' : 'bi-eye-slash'"></i>
                        {{ post.hidden ? 'Unhide' : 'Hide' }}
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        [disabled]="deleteLoading"
                        title="Delete post"
                        (click)="promptDelete(post)">
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
      title="Delete Post"
      message="Are you sure you want to delete this post? Its comments, likes and related reports will be removed permanently."
      confirmText="Yes, Delete Post"
      [loading]="deleteLoading"
      (confirmed)="onDeleteConfirm()"
      (cancelled)="cancelDelete()">
    </app-confirm-modal>
  `,
  styles: []
})
export class PostsTabComponent implements OnInit {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  posts: PostResponse[] = [];
  loading = true;
  error = '';
  deleteLoading = false;
  private togglingId: number | null = null;
  private pendingDeletePost: PostResponse | null = null;

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = '';

    this.api.get<PostResponse[]>('/admin/posts').subscribe({
      next: (posts) => {
        this.posts = posts || [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Could not load posts.';
      }
    });
  }

  isBusy(postId: number): boolean {
    return this.togglingId === postId;
  }

  toggleHidden(post: PostResponse): void {
    if (this.togglingId !== null) return;

    const nextHidden = !post.hidden;
    this.togglingId = post.id;

    // The backend treats the PATCH body as the new hidden flag.
    this.api.patch<PostResponse>(`/admin/posts/${post.id}/hide`, nextHidden).subscribe({
      next: (updated) => {
        this.posts = this.posts.map((item) => (item.id === updated.id ? updated : item));
        this.togglingId = null;
        this.notificationService.success(
          nextHidden ? `Post #${post.id} hidden.` : `Post #${post.id} is visible again.`
        );
      },
      error: (err) => {
        this.togglingId = null;
        this.notificationService.error(err.error?.message || 'Could not update post status.');
      }
    });
  }

  promptDelete(post: PostResponse): void {
    if (this.deleteLoading) return;
    this.pendingDeletePost = post;
    this.confirmModal.show();
  }

  cancelDelete(): void {
    if (!this.deleteLoading) {
      this.pendingDeletePost = null;
    }
  }

  onDeleteConfirm(): void {
    const target = this.pendingDeletePost;
    if (!target || this.deleteLoading) return;

    this.deleteLoading = true;
    this.api.delete<void>(`/admin/posts/${target.id}`).subscribe({
      next: () => {
        this.posts = this.posts.filter((post) => post.id !== target.id);
        this.pendingDeletePost = null;
        this.deleteLoading = false;
        this.confirmModal.close();
        this.notificationService.success(`Post #${target.id} deleted.`);
      },
      error: (err) => {
        this.deleteLoading = false;
        this.notificationService.error(err.error?.message || 'Could not delete post.');
      }
    });
  }

  truncate(text: string, maxLength: number): string {
    if (!text) return '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}…` : normalized;
  }
}

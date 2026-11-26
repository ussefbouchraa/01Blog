// Purpose: Admin — moderate posts.
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
    <div class="card adm-card adm-card-posts">
      <div class="adm-card-head">
        <h5 class="adm-card-title">
          <span class="adm-icon-tile adm-tile-posts"><i class="bi bi-file-earmark-text"></i></span>
          Posts <span class="adm-count">{{ posts.length }}</span>
        </h5>
        <button
          type="button"
          class="btn btn-sm adm-btn"
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
          <div class="alert alert-danger d-flex align-items-center justify-content-between mb-0" role="alert">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ error }}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" (click)="loadPosts()">Retry</button>
          </div>
        }
        @if (!loading && !error && posts.length === 0) {
          <div class="adm-empty">
            <i class="bi bi-file-earmark-x display-4 text-secondary"></i>
            <p>No posts found.</p>
          </div>
        }
        @if (!loading && !error && posts.length > 0) {
          <div class="table-responsive">
            <table class="table adm-table align-middle mb-0">
              <thead>
                <tr class="text-muted small text-uppercase">
                  <th>Author</th>
                  <th>Content</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (post of posts; track post.id) {
                  <tr>
                    <td>
                      <a [routerLink]="['/users', post.author.id]" class="fw-semibold text-decoration-none">
                        {{ post.author.username }}
                      </a>
                    </td>
                    <td class="small text-break" style="max-width: 300px;">
                      <a [routerLink]="['/posts', post.id]" class="text-decoration-none text-dark">
                        {{ truncate(post.content, 80) }}
                      </a>
                    </td>
                    <td>
                      <span class="badge adm-badge" [ngClass]="post.hidden ? 'bg-warning text-dark' : 'bg-success'">
                        {{ post.hidden ? 'Hidden' : 'Visible' }}
                      </span>
                    </td>
                    <td class="text-muted small text-nowrap">{{ post.createdAt | date:'mediumDate' }}</td>
                    <td class="text-end text-nowrap">
                      <button
                        type="button"
                        class="btn btn-sm adm-icon-btn"
                        [ngClass]="post.hidden ? 'adm-success' : 'adm-warning'"
                        [disabled]="isBusy(post.id)"
                        [title]="post.hidden ? 'Unhide post' : 'Hide post'"
                        (click)="toggleHidden(post)">
                        <i class="bi" [ngClass]="post.hidden ? 'bi-eye' : 'bi-eye-slash'"></i>
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm adm-icon-btn adm-danger ms-1"
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
    if (!this.deleteLoading) this.pendingDeletePost = null;
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
        this.confirmModal.dismiss();
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

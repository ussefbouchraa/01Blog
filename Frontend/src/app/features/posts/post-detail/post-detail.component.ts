// Purpose: Post detail page component.
// Displays full post content, media, like toggle with real-time count, and owner actions (edit/delete).
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PostResponse, LikeResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-8">
        <!-- Back Navigation -->
        <div class="mb-3">
          <a routerLink="/home" class="btn btn-sm btn-link text-decoration-none text-muted p-0">
            <i class="bi bi-arrow-left me-1"></i>Back to Feed
          </a>
        </div>

        <!-- Loading State -->
        @if (loading) {
          <app-loading message="Loading post..."></app-loading>
        }

        <!-- Error State -->
        @if (errorMessage && !loading) {
          <div class="alert alert-danger d-flex align-items-center justify-content-between shadow-sm">
            <div>
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              {{ errorMessage }}
            </div>
            <a routerLink="/home" class="btn btn-sm btn-outline-danger">Go to Feed</a>
          </div>
        }

        <!-- Post Content View -->
        @if (post && !loading) {
          <article class="card shadow-sm border-0 mb-4 overflow-hidden">
            <!-- Header: Author & Controls -->
            <div class="card-header bg-white border-0 pt-3 pb-2 px-4 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <a [routerLink]="['/users', post.author.id]" class="text-decoration-none me-3">
                  @if (post.author.avatarUrl) {
                    <img
                      [src]="postsService.getMediaUrl(post.author.avatarUrl)"
                      alt="{{ post.author.username }}'s avatar"
                      class="rounded-circle object-fit-cover"
                      width="48"
                      height="48" />
                  } @else {
                    <i class="bi bi-person-circle fs-1 text-secondary"></i>
                  }
                </a>
                <div>
                  <a [routerLink]="['/users', post.author.id]" class="fw-bold text-dark text-decoration-none fs-5 d-block">
                    {{ post.author.username }}
                  </a>
                  <span class="text-muted small">
                    <i class="bi bi-calendar3 me-1"></i>Published {{ post.createdAt | date:'mediumDate' }}
                    @if (post.updatedAt && post.updatedAt !== post.createdAt) {
                      <span class="ms-1 fst-italic">(edited)</span>
                    }
                  </span>
                </div>
              </div>

              <!-- Owner / Admin Action Buttons -->
              @if (isAuthorOrAdmin) {
                <div class="dropdown">
                  <div class="btn-group">
                    <a
                      [routerLink]="['/posts', post.id, 'edit']"
                      class="btn btn-sm btn-outline-secondary"
                      title="Edit Post">
                      <i class="bi bi-pencil me-1"></i>Edit
                    </a>
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      (click)="confirmModal.open()"
                      title="Delete Post">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Body -->
            <div class="card-body px-4 py-3">
              <p class="card-text text-dark fs-6 mb-4 text-break" style="white-space: pre-line; line-height: 1.7;">
                {{ post.content }}
              </p>

              <!-- Media Attachment -->
              @if (post.mediaUrl) {
                <div class="rounded overflow-hidden bg-light mb-3 text-center">
                  @if (isImageMedia(post.mediaType)) {
                    <img
                      [src]="postsService.getMediaUrl(post.mediaUrl)"
                      alt="Post attachment"
                      class="img-fluid rounded"
                      style="max-height: 550px; width: 100%; object-fit: contain;" />
                  } @else if (isVideoMedia(post.mediaType)) {
                    <video
                      [src]="postsService.getMediaUrl(post.mediaUrl)"
                      controls
                      class="w-100 rounded"
                      style="max-height: 550px;">
                      Your browser does not support the video tag.
                    </video>
                  }
                </div>
              }
            </div>

            <!-- Footer: Like & Social Interaction Bar -->
            <div class="card-footer bg-light bg-opacity-75 border-top px-4 py-2 d-flex align-items-center justify-content-between">
              <!-- Like Action (Optimistic toggle with count) -->
              <div class="d-flex align-items-center">
                <button
                  type="button"
                  class="btn d-inline-flex align-items-center me-3"
                  [ngClass]="isLiked ? 'btn-danger' : 'btn-outline-danger'"
                  (click)="toggleLike()"
                  [disabled]="likeLoading">
                  <i class="bi me-2" [ngClass]="isLiked ? 'bi-heart-fill' : 'bi-heart'"></i>
                  <span class="fw-semibold">{{ likeCount }}</span>
                  <span class="ms-1 d-none d-sm-inline">{{ likeCount === 1 ? 'Like' : 'Likes' }}</span>
                </button>
              </div>
            </div>
          </article>

          <!-- Comments Section Placeholder (Phase 3 implementation) -->
          <section class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white border-0 pt-3 px-4">
              <h5 class="fw-bold mb-0">
                <i class="bi bi-chat-text me-2 text-primary"></i>Comments & Discussion
              </h5>
            </div>
            <div class="card-body px-4 py-4 text-center text-muted">
              <i class="bi bi-chat-square-dots display-6 text-secondary d-block mb-2"></i>
              <p class="mb-0">Discussion feature is coming in Phase 3.</p>
            </div>
          </section>
        }

        <!-- Confirmation Modal for Deleting Post -->
        <app-confirm-modal
          #confirmModal
          title="Delete Post"
          message="Are you sure you want to permanently delete this post? All associated comments and likes will also be removed."
          confirmText="Yes, Delete Post"
          [loading]="deleteLoading"
          (confirmed)="onDeletePost()">
        </app-confirm-modal>
      </div>
    </div>
  `,
  styles: []
})
export class PostDetailComponent implements OnInit {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;

  post: PostResponse | null = null;
  loading = true;
  errorMessage = '';

  likeCount = 0;
  isLiked = false;
  likeLoading = false;
  deleteLoading = false;

  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public postsService: PostsService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.currentUserRole = this.authService.getRole();

    const postIdParam = this.route.snapshot.paramMap.get('id');
    const postId = postIdParam ? Number(postIdParam) : null;

    if (!postId || isNaN(postId)) {
      this.errorMessage = 'Invalid post ID.';
      this.loading = false;
      return;
    }

    this.loadPostData(postId);
  }

  loadPostData(postId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.postsService.getPostById(postId).subscribe({
      next: (postData) => {
        this.post = postData;
        this.loading = false;
        this.loadLikes(postId);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.status === 404
            ? 'Post not found.'
            : err.error?.message || 'Failed to load post.';
      }
    });
  }

  loadLikes(postId: number): void {
    this.postsService.getLikes(postId).subscribe({
      next: (likes: LikeResponse[]) => {
        this.likeCount = likes.length;
        this.isLiked = likes.some((like) => like.user?.id === this.currentUserId);
      },
      error: () => {
        // Soft-fail: if like count fails to load, keep 0
        this.likeCount = 0;
        this.isLiked = false;
      }
    });
  }

  toggleLike(): void {
    if (!this.post || this.likeLoading) return;

    const postId = this.post.id;
    const previousLiked = this.isLiked;
    const previousCount = this.likeCount;

    // Optimistic UI update
    this.isLiked = !previousLiked;
    this.likeCount = this.isLiked ? previousCount + 1 : Math.max(0, previousCount - 1);
    this.likeLoading = true;

    if (!previousLiked) {
      // User is liking the post
      this.postsService.likePost(postId).subscribe({
        next: () => {
          this.likeLoading = false;
        },
        error: (err) => {
          // Rollback
          this.isLiked = previousLiked;
          this.likeCount = previousCount;
          this.likeLoading = false;
          this.notificationService.error(err.error?.message || 'Could not like post.');
        }
      });
    } else {
      // User is unliking the post
      this.postsService.unlikePost(postId).subscribe({
        next: () => {
          this.likeLoading = false;
        },
        error: (err) => {
          // Rollback
          this.isLiked = previousLiked;
          this.likeCount = previousCount;
          this.likeLoading = false;
          this.notificationService.error(err.error?.message || 'Could not unlike post.');
        }
      });
    }
  }

  get isAuthorOrAdmin(): boolean {
    if (!this.post) return false;
    const isAuthor = this.currentUserId !== null && this.currentUserId === this.post.author.id;
    const isAdmin = this.currentUserRole === 'ROLE_ADMIN';
    return isAuthor || isAdmin;
  }

  onDeletePost(): void {
    if (!this.post || this.deleteLoading) return;

    this.deleteLoading = true;
    this.postsService.deletePost(this.post.id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.confirmModal.close();
        this.notificationService.success('Post deleted successfully.');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.deleteLoading = false;
        this.notificationService.error(err.error?.message || 'Failed to delete post.');
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
}

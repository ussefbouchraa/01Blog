// Purpose: Post detail page component.
// Displays full post content, media, likes, comments, and owner actions.
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PostsService } from '../posts.service';
import { CommentsService } from '../../comments/comments.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CommentResponse, LikeResponse, PostResponse } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent, ConfirmModalComponent],
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

          <!-- Comments Section -->
          <section class="card shadow-sm border-0 mb-4">
            <div class="card-header bg-white border-0 pt-3 px-4">
              <h5 class="fw-bold mb-0">
                <i class="bi bi-chat-text me-2 text-primary"></i>Comments & Discussion
                <span class="badge bg-secondary ms-1">{{ comments.length }}</span>
              </h5>
            </div>
            <div class="card-body px-4 py-3">
              @if (isLoggedIn()) {
                <form class="mb-4" (ngSubmit)="addComment()">
                  <div class="d-flex align-items-start gap-2">
                    <textarea
                      class="form-control"
                      rows="2"
                      name="newComment"
                      [(ngModel)]="newComment"
                      placeholder="Write a comment..."
                      maxlength="1000"
                      [disabled]="commentSubmitting"></textarea>
                    <button
                      type="submit"
                      class="btn btn-primary text-nowrap"
                      [disabled]="commentSubmitting || !newComment.trim()">
                      @if (commentSubmitting) {
                        <span class="spinner-border spinner-border-sm me-1" role="status"></span>
                      } @else {
                        <i class="bi bi-send me-1"></i>
                      }
                      Post
                    </button>
                  </div>
                </form>
              } @else {
                <p class="text-muted small mb-4">
                  <a routerLink="/login" class="text-decoration-none">Log in</a> to join the discussion.
                </p>
              }

              @if (commentsLoading) {
                <div class="text-center text-muted py-3">
                  <span class="spinner-border spinner-border-sm text-primary" role="status"></span>
                  <span class="ms-2 small">Loading comments...</span>
                </div>
              }

              @if (commentsError) {
                <div class="alert alert-danger py-2 small" role="alert">{{ commentsError }}</div>
              }

              @if (!commentsLoading && !commentsError && comments.length === 0) {
                <p class="text-muted small text-center py-3 mb-0">
                  No comments yet. Start the discussion!
                </p>
              }

              <ul class="list-unstyled mb-0">
                @for (comment of comments; track comment.id) {
                  <li class="d-flex gap-3 py-3 border-top">
                    <div class="flex-shrink-0">
                      @if (comment.author.avatarUrl) {
                        <img
                          [src]="postsService.getMediaUrl(comment.author.avatarUrl)"
                          alt="{{ comment.author.username }}'s avatar"
                          class="rounded-circle object-fit-cover"
                          width="36"
                          height="36" />
                      } @else {
                        <div
                          class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary"
                          style="width: 36px; height: 36px;">
                          <i class="bi bi-person-fill"></i>
                        </div>
                      }
                    </div>

                    <div class="flex-grow-1 min-w-0">
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <a
                          [routerLink]="['/users', comment.author.id]"
                          class="fw-bold text-dark text-decoration-none small">
                          {{ comment.author.username }}
                        </a>
                        <span class="text-muted small">{{ comment.createdAt | date:'mediumDate' }}</span>

                        @if (isOwnComment(comment) && comment.id > 0) {
                          <div class="ms-auto d-flex gap-2">
                            <button
                              type="button"
                              class="btn btn-sm btn-link text-decoration-none p-0"
                              [disabled]="editingCommentId !== null || commentDeleting"
                              (click)="startEdit(comment)">
                              Edit
                            </button>
                            <button
                              type="button"
                              class="btn btn-sm btn-link text-danger text-decoration-none p-0"
                              [disabled]="commentDeleting"
                              (click)="confirmDeleteComment(comment)">
                              Delete
                            </button>
                          </div>
                        }
                      </div>

                      @if (editingCommentId === comment.id) {
                        <div class="d-flex align-items-start gap-2">
                          <textarea
                            class="form-control form-control-sm"
                            rows="2"
                            [(ngModel)]="editCommentText"
                            [ngModelOptions]="{ standalone: true }"
                            maxlength="1000"
                            [disabled]="commentSaving"></textarea>
                          <button
                            type="button"
                            class="btn btn-sm btn-primary text-nowrap"
                            [disabled]="commentSaving || !editCommentText.trim()"
                            (click)="saveEdit(comment)">
                            Save
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary text-nowrap"
                            [disabled]="commentSaving"
                            (click)="cancelEdit()">
                            Cancel
                          </button>
                        </div>
                      } @else {
                        <p class="mb-0 text-break small" style="white-space: pre-line; line-height: 1.6;">
                          {{ comment.content }}
                        </p>
                      }
                    </div>
                  </li>
                }
              </ul>
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

        <!-- Confirmation Modal for Deleting a Comment -->
        <app-confirm-modal
          #commentConfirmModal
          title="Delete Comment"
          message="Are you sure you want to delete this comment?"
          confirmText="Yes, Delete Comment"
          [loading]="commentDeleting"
          (confirmed)="onDeleteComment()"
          (cancelled)="cancelDeleteComment()">
        </app-confirm-modal>
      </div>
    </div>
  `,
  styles: []
})
export class PostDetailComponent implements OnInit {
  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  @ViewChild('commentConfirmModal') commentConfirmModal!: ConfirmModalComponent;

  post: PostResponse | null = null;
  loading = true;
  errorMessage = '';

  likeCount = 0;
  isLiked = false;
  likeLoading = false;
  deleteLoading = false;

  comments: CommentResponse[] = [];
  commentsLoading = false;
  commentsError = '';
  newComment = '';
  commentSubmitting = false;
  editingCommentId: number | null = null;
  editCommentText = '';
  commentSaving = false;
  commentDeleting = false;
  private commentToDelete: CommentResponse | null = null;

  currentUserId: number | null = null;
  currentUserRole: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public postsService: PostsService,
    private commentsService: CommentsService,
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
        this.loadComments(postId);
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

  loadComments(postId: number): void {
    this.commentsLoading = true;
    this.commentsError = '';

    this.commentsService.getComments(postId).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.commentsLoading = false;
      },
      error: () => {
        this.comments = [];
        this.commentsLoading = false;
        this.commentsError = 'Could not load comments.';
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isOwnComment(comment: CommentResponse): boolean {
    return this.currentUserId !== null && comment.author.id === this.currentUserId;
  }

  addComment(): void {
    const content = this.newComment.trim();
    if (!this.post || !content || this.commentSubmitting || !this.isLoggedIn()) return;

    const postId = this.post.id;
    const temporaryId = -Date.now();
    const optimisticComment: CommentResponse = {
      id: temporaryId,
      postId,
      content,
      createdAt: new Date().toISOString(),
      author: {
        id: this.currentUserId ?? 0,
        username: this.authService.getUsername(),
        avatarUrl: null
      }
    };

    this.comments = [...this.comments, optimisticComment];
    this.newComment = '';
    this.commentSubmitting = true;

    this.commentsService.addComment(postId, content).subscribe({
      next: (savedComment) => {
        this.comments = this.comments.map((comment) =>
          comment.id === temporaryId ? savedComment : comment
        );
        this.commentSubmitting = false;
      },
      error: (err) => {
        this.comments = this.comments.filter((comment) => comment.id !== temporaryId);
        this.newComment = content;
        this.commentSubmitting = false;
        this.notificationService.error(err.error?.message || 'Could not post your comment.');
      }
    });
  }

  startEdit(comment: CommentResponse): void {
    if (!this.isOwnComment(comment) || comment.id <= 0) return;
    this.editingCommentId = comment.id;
    this.editCommentText = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId = null;
    this.editCommentText = '';
  }

  saveEdit(comment: CommentResponse): void {
    const content = this.editCommentText.trim();
    if (
      !content ||
      this.commentSaving ||
      this.editingCommentId !== comment.id ||
      !this.isOwnComment(comment)
    ) {
      return;
    }

    if (content === comment.content) {
      this.cancelEdit();
      return;
    }

    this.commentSaving = true;
    this.commentsService.updateComment(comment.id, content).subscribe({
      next: (updatedComment) => {
        this.comments = this.comments.map((item) =>
          item.id === updatedComment.id ? updatedComment : item
        );
        this.commentSaving = false;
        this.cancelEdit();
      },
      error: (err) => {
        this.commentSaving = false;
        this.notificationService.error(err.error?.message || 'Could not update your comment.');
      }
    });
  }

  confirmDeleteComment(comment: CommentResponse): void {
    if (!this.isOwnComment(comment) || comment.id <= 0) return;
    this.commentToDelete = comment;
    this.commentConfirmModal.open();
  }

  cancelDeleteComment(): void {
    if (!this.commentDeleting) {
      this.commentToDelete = null;
    }
  }

  onDeleteComment(): void {
    const target = this.commentToDelete;
    if (!target || this.commentDeleting || !this.isOwnComment(target)) return;

    this.commentDeleting = true;
    this.commentsService.deleteComment(target.id).subscribe({
      next: () => {
        this.comments = this.comments.filter((comment) => comment.id !== target.id);
        if (this.editingCommentId === target.id) {
          this.cancelEdit();
        }
        this.commentDeleting = false;
        this.commentToDelete = null;
        this.commentConfirmModal.close();
        this.notificationService.success('Comment deleted.');
      },
      error: (err) => {
        this.commentDeleting = false;
        this.notificationService.error(err.error?.message || 'Could not delete your comment.');
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
